# JG Cardápio

Cardápio online para lojas de comida. Cada loja tem um endereço próprio no caminho (`/zedoburguerlucelia`), o cliente monta o pedido, o pedido é gravado no banco e a loja recebe o resumo no WhatsApp e acompanha tudo no painel (`/painel`).

## Rodar localmente

Precisa de Node 22+ e Docker.

```bash
npm install
npx supabase start          # sobe o banco local com o esquema e o cardápio de exemplo
npx supabase status -o env  # copie API_URL e ANON_KEY para o .env.local (veja .env.example)
npm run dev
```

O banco local roda nas portas 553xx para não conflitar com outros projetos Supabase da máquina. A conta de teste do painel está em `supabase/seed.sql`.

## Verificação

```bash
npm run check
```

Roda stylelint, typecheck, as regras de camadas (steiger), os testes e o build.

## Visual por tema

Ícones, ilustrações e imagens padrão moram em `public/temas/<tema>/`, com nome fixo por slot (`icone-sacola.png`, `estado-sacola-vazia.png`, `capa-padrao.jpg`). Cada arquivo que existir substitui o desenho provisório; os que faltarem continuam com o provisório. A pasta com o endereço da loja (`public/temas/zedoburguerlucelia/`) tem prioridade sobre a pasta do tema base.
