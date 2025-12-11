import { navigateTo } from '../core/router.js';

export function renderSidebar() {
    const nav = document.getElementById('main-nav');
    
    const menuItems = [
        { id: 'dashboard', icon: 'dashboard', label: 'Visão Geral', active: true },
        { id: 'agenda', icon: 'event_note', label: 'Meus Eventos', active: false },
        { type: 'separator', label: 'GESTÃO' },
        { id: 'participants', icon: 'people', label: 'Participantes', active: false },
        { id: 'teams', icon: 'groups', label: 'Times & Projetos', active: false },
        { id: 'tasks', icon: 'check_circle', label: 'Tarefas (Kanban)', active: false },
        { id: 'financial', icon: 'payments', label: 'Financeiro', active: false },
        { type: 'separator', label: 'MARKETING' },
        { id: 'marketing', icon: 'campaign', label: 'Campanhas', active: false },
        { id: 'suppliers', icon: 'store', label: 'Fornecedores', active: false },
    ];

    let html = '';
    menuItems.forEach(item => {
        if (item.type === 'separator') {
            html += `<div style="margin: 1.5rem 0 0.5rem 1rem; font-size: 0.75rem; font-weight: 700; color: #aaa; letter-spacing: 1px;">${item.label}</div>`;
        } else {
            html += `
                <a href="#" class="nav-item ${item.active ? 'active' : ''}" id="nav-${item.id}" onclick="window.handleNav('${item.id}', this)">
                    <span class="material-icons-round">${item.icon}</span> <span>${item.label}</span>
                </a>
            `;
        }
    });

    nav.innerHTML = html;
    setupProfileConfig();
}

window.handleNav = (route, element) => {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    navigateTo(route);
};

/* --- SISTEMA DE MODAIS GLOBAL --- */

// Renderiza a estrutura base se não existir
if (!document.getElementById('app-modal')) {
    const modalHTML = `
        <div id="app-modal" class="modal-overlay hidden">
            <div class="modal-container">
                <div class="modal-header">
                    <h3 id="modal-title">Título</h3>
                    <button onclick="window.closeModal()" class="btn-icon"><span class="material-icons-round">close</span></button>
                </div>
                <div id="modal-body" class="modal-body"></div>
                <div id="modal-footer" class="modal-footer"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openModal = (title, bodyHTML, footerHTML = '') => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML;
    
    const modal = document.getElementById('app-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('visible'), 10);
};

window.closeModal = () => {
    const modal = document.getElementById('app-modal');
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

// Prompt Bonito
window.promptModal = (title, label, callback) => {
    const body = `
        <label class="input-label">${label}</label>
        <input type="text" id="modal-input" class="big-input" autocomplete="off">
    `;
    const footer = `
        <button onclick="window.closeModal()" class="btn-text">Cancelar</button>
        <button id="btn-confirm" class="btn-create">Confirmar</button>
    `;
    
    window.openModal(title, body, footer);
    setTimeout(() => document.getElementById('modal-input').focus(), 100);
    
    document.getElementById('btn-confirm').onclick = () => {
        const val = document.getElementById('modal-input').value;
        if(val) {
            callback(val);
            window.closeModal();
        }
    };
    
    // Enter para confirmar
    document.getElementById('modal-input').onkeydown = (e) => {
        if(e.key === 'Enter') document.getElementById('btn-confirm').click();
    };
};

// Confirm Bonito (Sim/Não) - NOVO
window.confirmModal = (title, text, onConfirm) => {
    const body = `<p style="color:#555; line-height:1.5;">${text}</p>`;
    const footer = `
        <button onclick="window.closeModal()" class="btn-text">Cancelar</button>
        <button id="btn-yes" class="btn-create" style="background:#ef5350;">Sim, continuar</button>
    `;
    
    window.openModal(title, body, footer);
    
    document.getElementById('btn-yes').onclick = () => {
        window.closeModal();
        onConfirm();
    };
};

/* --- CONFIGURAÇÕES DO SISTEMA (MODAL) --- */
function setupProfileConfig() {
    const profileContainer = document.querySelector('.user-profile');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.8rem; flex:1;">
            <div class="avatar">RM</div>
            <div class="info">
                <p class="name">Rhuan M.</p>
                <p class="role">Admin</p>
            </div>
        </div>
        <button id="btn-config-api" class="btn-icon" title="Configurações">
            <span class="material-icons-round">settings</span>
        </button>
    `;

    document.getElementById('btn-config-api').onclick = () => {
        const body = `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <button id="cfg-api" class="selection-card" style="flex-direction:row; height:auto; padding:1rem; gap:1rem; align-items:center;">
                    <span class="material-icons-round" style="margin:0; font-size:1.5rem; color:var(--primary);">key</span>
                    <div style="text-align:left;">
                        <h3 style="margin:0; font-size:1rem;">API Key (IA)</h3>
                        <p style="margin:0; font-size:0.8rem; color:#888;">Configurar chave do Google Gemini</p>
                    </div>
                </button>
                
                <button id="cfg-reset" class="selection-card" style="flex-direction:row; height:auto; padding:1rem; gap:1rem; align-items:center; border-color:#ffcdd2;">
                    <span class="material-icons-round" style="margin:0; font-size:1.5rem; color:#ef5350;">delete_forever</span>
                    <div style="text-align:left;">
                        <h3 style="margin:0; font-size:1rem; color:#d32f2f;">Resetar Sistema</h3>
                        <p style="margin:0; font-size:0.8rem; color:#888;">Apagar todos os eventos e dados</p>
                    </div>
                </button>
            </div>
        `;
        
        window.openModal('Configurações', body);

        // Ações dos botões
        document.getElementById('cfg-api').onclick = () => {
            const current = localStorage.getItem('hacka_api_key') || '';
            window.promptModal('Configurar IA', 'Cole sua API Key do Google:', (key) => {
                localStorage.setItem('hacka_api_key', key);
                localStorage.removeItem('hacka_best_model'); // Limpa cache de modelo
                alert('✅ Chave salva com sucesso!'); // Alert simples aqui é aceitável ou use toast futuro
            });
        };

        document.getElementById('cfg-reset').onclick = () => {
            window.confirmModal('Zona de Perigo', 'Isso apagará TODOS os seus eventos e tarefas. Não há como desfazer. Tem certeza?', () => {
                localStorage.clear();
                location.reload();
            });
        };
    };
}