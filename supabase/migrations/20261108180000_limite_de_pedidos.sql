-- Limite de pedidos por loja ----------------------------------------------
-- O site é público e a place_order aceita pedido de qualquer um. O gatilho
-- recusa rajadas por telefone, por IP e pelo total da loja numa janela curta.

-- Guarda só o hash do IP: o dado pessoal nunca fica em claro e some em um dia.
create table public.order_rate_events (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    ip_hash text not null,
    created_at timestamptz not null default now()
);

alter table public.order_rate_events enable row level security;
revoke all on public.order_rate_events from anon, authenticated;

create index order_rate_events_store_created_idx on public.order_rate_events (store_id, created_at);
create index order_rate_events_store_ip_created_idx on public.order_rate_events (store_id, ip_hash, created_at);
create index orders_store_phone_created_idx on public.orders (store_id, customer_phone, created_at);

-- Só chamada pública é limitada: insert como dono do banco (carga, testes,
-- scripts) passa direto. O IP vem de cabeçalhos que o cliente não consegue
-- forjar; x-forwarded-for aceita valor enviado pelo cliente e fica de fora.
create function public.enforce_order_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    window_length constant interval := interval '10 minutes';
    event_retention constant interval := interval '1 day';
    max_orders_per_phone constant integer := 3;
    max_orders_per_ip constant integer := 5;
    max_orders_per_store constant integer := 30;

    caller_role text := current_setting('role', true);
    raw_headers text := nullif(current_setting('request.headers', true), '');
    headers jsonb := coalesce(raw_headers::jsonb, '{}'::jsonb);
    client_ip text;
    client_ip_hash text;
    window_start timestamptz := now() - window_length;
begin
    if caller_role is null or caller_role not in ('anon', 'authenticated') then
        return new;
    end if;

    client_ip := coalesce(
        nullif(btrim(headers ->> 'sb-forwarded-for'), ''),
        nullif(btrim(headers ->> 'cf-connecting-ip'), ''),
        nullif(btrim(headers ->> 'x-real-ip'), '')
    );

    if (
        select count(*) from public.orders
        where store_id = new.store_id
          and customer_phone = new.customer_phone
          and created_at > window_start
    ) >= max_orders_per_phone then
        raise exception 'too_many_orders';
    end if;

    if (
        select count(*) from public.orders
        where store_id = new.store_id and created_at > window_start
    ) >= max_orders_per_store then
        raise exception 'too_many_orders';
    end if;

    if client_ip is not null then
        client_ip_hash := encode(sha256(convert_to(client_ip, 'UTF8')), 'hex');

        if (
            select count(*) from public.order_rate_events
            where store_id = new.store_id
              and ip_hash = client_ip_hash
              and created_at > window_start
        ) >= max_orders_per_ip then
            raise exception 'too_many_orders';
        end if;

        insert into public.order_rate_events (store_id, ip_hash)
        values (new.store_id, client_ip_hash);
    end if;

    delete from public.order_rate_events
    where store_id = new.store_id and created_at < now() - event_retention;

    return new;
end;
$$;

create trigger orders_rate_limit
    before insert on public.orders
    for each row execute function public.enforce_order_rate_limit();
