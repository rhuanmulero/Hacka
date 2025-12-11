import { initRouter, navigateTo } from './core/router.js';
import { renderSidebar } from './modules/ui.js';

// --- PONTO CRÍTICO ---
// Expõe a função de navegação para o escopo Global (window).
// Isso é OBRIGATÓRIO porque usamos onclick="window.navTo(...)" nas strings de HTML do Wizard e Events.
window.navTo = (route) => {
    navigateTo(route);
};

// Inicialização do Sistema
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Iniciando Hacka System...");

    try {
        // 1. Renderiza a Sidebar e configura os eventos do menu
        renderSidebar();

        // 2. Inicia o Roteador (Carrega a Dashboard ou a tela inicial)
        initRouter();
        
        console.log("✅ Sistema carregado.");
    } catch (error) {
        console.error("❌ Erro Fatal na inicialização do app.js:", error);
        alert("Erro ao carregar o sistema. Verifique o console (F12).");
    }
});