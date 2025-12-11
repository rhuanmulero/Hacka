import { renderDashboard } from '../modules/dashboard.js';
import { renderWizard } from '../modules/wizard.js';
import { renderEvents } from '../modules/events.js';
import { renderKanban } from '../modules/kanban.js'; 

const appRoot = document.getElementById('app-root');

export function navigateTo(route) {
    appRoot.innerHTML = '';
    
    switch(route) {
        case 'dashboard':
            renderDashboard(appRoot);
            break;
        case 'agenda':
            renderEvents(appRoot);
            break;
        case 'wizard':
            renderWizard(appRoot);
            break;
        
        // Rotas Futuras (Placeholders)
        case 'participants':
            renderConstruction(appRoot, 'Gestão de Participantes', 'people', 'Aqui você gerenciará inscrições, check-in e listas de presença.');
            break;
        case 'teams':
            renderConstruction(appRoot, 'Times & Projetos', 'groups', 'Ferramentas para formação de equipes, submissão de projetos e avaliação de jurados.');
            break;
        case 'tasks':
            renderKanban(appRoot);
        break;
        case 'financial':
            renderConstruction(appRoot, 'Financeiro', 'payments', 'Controle de orçamento, patrocinadores, despesas e venda de ingressos.');
            break;
        case 'marketing':
            renderConstruction(appRoot, 'Marketing', 'campaign', 'Disparo de e-mails, posts sociais e tracking de conversão.');
            break;
        case 'suppliers':
            renderConstruction(appRoot, 'Fornecedores', 'store', 'Gestão de contratos, buffet, local e infraestrutura.');
            break;
            
        default:
            renderDashboard(appRoot);
    }
}

// Função auxiliar para tela de "Em Breve"
function renderConstruction(container, title, icon, desc) {
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; text-align:center; color: #555;">
            <div style="background:#fff3e0; padding:2rem; border-radius:50%; margin-bottom:1.5rem;">
                <span class="material-icons-round" style="font-size:4rem; color:#ef6c00;">${icon}</span>
            </div>
            <h1 style="font-size:2rem; margin-bottom:0.5rem;">${title}</h1>
            <span style="background:#eee; padding:0.3rem 0.8rem; border-radius:20px; font-size:0.8rem; font-weight:700; color:#777; margin-bottom:1.5rem;">EM DESENVOLVIMENTO</span>
            <p style="max-width:400px; line-height:1.6; color:#666;">${desc}</p>
            <button onclick="window.navTo('dashboard')" class="btn-create" style="margin-top:2rem; background:#555;">Voltar ao Início</button>
        </div>
    `;
}

export function initRouter() {
    navigateTo('dashboard');
}