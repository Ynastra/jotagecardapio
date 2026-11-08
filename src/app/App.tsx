import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { HomePage } from '@/pages/home'
import { OrderTrackingPage } from '@/pages/order-tracking'
import { AddonsPage } from '@/pages/panel-addons'
import { PanelOrdersPage } from '@/pages/panel-orders'
import { StoreMenuPage } from '@/pages/store-menu'

import { PanelLayout } from './layouts/panel'

// O endereço de cada loja é o primeiro trecho do caminho
// (jgcardapio.com.br/zedoburguerlucelia); os caminhos fixos vêm antes e ficam
// proibidos como endereço de loja no banco.
export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/painel" element={<PanelLayout />}>
                    <Route index element={<Navigate to="pedidos" replace />} />
                    <Route path="pedidos" element={<PanelOrdersPage />} />
                    <Route path="adicionais" element={<AddonsPage />} />
                    <Route path="*" element={<Navigate to="/painel/pedidos" replace />} />
                </Route>
                <Route path="/:slug/pedido/:token" element={<OrderTrackingPage />} />
                <Route path="/:slug" element={<StoreMenuPage />} />
                <Route path="*" element={<StoreMenuPage />} />
            </Routes>
        </BrowserRouter>
    )
}
