import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { HomePage } from '@/pages/home'
import { PanelPage } from '@/pages/panel'
import { StoreMenuPage } from '@/pages/store-menu'

// O endereço de cada loja é o primeiro trecho do caminho
// (jgcardapio.com.br/zedoburguerlucelia); os caminhos fixos vêm antes e ficam
// proibidos como endereço de loja no banco.
export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/painel" element={<PanelPage />} />
                <Route path="/:slug" element={<StoreMenuPage />} />
                <Route path="*" element={<StoreMenuPage />} />
            </Routes>
        </BrowserRouter>
    )
}
