// js/modules/ui.js
import { navigateTo } from '../core/router.js';

export function renderSidebar() {
    const nav = document.getElementById('main-nav');
    
    // Nova Estrutura Hierárquica
    const menuStructure = [
        // GRUPO 1: PRINCIPAL
        { type: 'link', id: 'dashboard', icon: 'dashboard', label: 'Visão Geral' },
        { type: 'link', id: 'agenda', icon: 'event_note', label: 'Meus Eventos' },
        { type: 'link', id: 'external', icon: 'badge', label: 'Minha Atuação' }, 
        
        // GRUPO 2: OPERAÇÃO
        { type: 'label', label: 'OPERAÇÃO' },
        { type: 'link', id: 'schedule', icon: 'schedule', label: 'Programação' },
        { type: 'link', id: 'checkin', icon: 'qr_code_scanner', label: 'Portaria' },

        // GRUPO 3: PESSOAS & VENDAS
        { type: 'label', label: 'PESSOAS' },
        { 
            type: 'accordion', 
            icon: 'groups', 
            label: 'Participantes', 
            id: 'group_people',
            children: [
                { id: 'participants', label: 'Lista Geral' },
                { id: 'tickets', label: 'Ingressos' },
                { id: 'teams', label: 'Times (Hacka)' },
                { id: 'certificates', label: 'Certificados' }
            ]
        },

        // GRUPO 4: GESTÃO
        { type: 'label', label: 'BACKOFFICE' },
        { 
            type: 'accordion', 
            icon: 'business_center', 
            label: 'Gestão', 
            id: 'group_management',
            children: [
                { id: 'financial', label: 'Financeiro' },
                { id: 'tasks', label: 'Tarefas' },
                { id: 'marketing', label: 'Campanhas' },
                { id: 'feedback', label: 'Pesquisa NPS' },
                { id: 'suppliers', label: 'Fornecedores' }
            ]
        }
    ];

    let html = '';
    
    menuStructure.forEach(item => {
        if (item.type === 'label') {
            html += `<div class="nav-group-label">${item.label}</div>`;
        } 
        else if (item.type === 'link') {
            html += `
                <div class="nav-item" id="nav-${item.id}" onclick="window.handleNav('${item.id}', this)">
                    <span class="material-icons-round">${item.icon}</span> <span>${item.label}</span>
                </div>
            `;
        }
        else if (item.type === 'accordion') {
            html += `
                <div class="nav-item nav-has-submenu" onclick="window.toggleSubmenu('${item.id}', this)">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <span class="material-icons-round">${item.icon}</span> 
                        <span>${item.label}</span>
                    </div>
                    <span class="material-icons-round nav-arrow">expand_more</span>
                </div>
                <div id="sub-${item.id}" class="submenu-container">
                    ${item.children.map(child => `
                        <div class="sub-nav-item" id="nav-${child.id}" onclick="window.handleNav('${child.id}', this)">
                            <span class="material-icons-round">subdirectory_arrow_right</span> ${child.label}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    });

    nav.innerHTML = html;
    setupProfileConfig();
}

// --- LÓGICA DE NAVEGAÇÃO E MOBILE ---

window.handleNav = (route, element) => {
    // Remove active de tudo
    document.querySelectorAll('.nav-item, .sub-nav-item').forEach(el => el.classList.remove('active'));
    
    // Adiciona ao clicado
    element.classList.add('active');
    
    // Se for submenu, ilumina o pai
    if(element.classList.contains('sub-nav-item')) {
        element.parentElement.previousElementSibling.classList.add('active');
    }

    navigateTo(route);

    // [NOVO] Fecha o menu automaticamente se estiver no mobile
    if (window.innerWidth <= 768) {
        window.toggleMobileMenu();
    }
};

window.toggleSubmenu = (id, element) => {
    const container = document.getElementById(`sub-${id}`);
    if (container) {
        element.classList.toggle('open');
        container.classList.toggle('visible');
    }
};

// [NOVO] Função para abrir/fechar menu mobile
window.toggleMobileMenu = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }
};

/* --- SISTEMA DE MODAIS GLOBAL --- */

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
    document.getElementById('modal-input').onkeydown = (e) => {
        if(e.key === 'Enter') document.getElementById('btn-confirm').click();
    };
};

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

/* --- CONFIGURAÇÕES E RESET --- */
function setupProfileConfig() {
    const profileContainer = document.querySelector('.user-profile');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.8rem; flex:1; overflow:hidden;">
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

        // Lógica da API Key
        document.getElementById('cfg-api').onclick = () => {
            window.promptModal('Configurar IA', 'Cole sua API Key do Google:', (key) => {
                localStorage.setItem('hacka_api_key', key);
                localStorage.removeItem('hacka_best_model'); 
                setTimeout(() => {
                    window.openModal('Sucesso', '<div style="text-align:center; padding:1rem;">✅ Chave salva!</div>', 
                    '<button onclick="window.closeModal()" class="btn-create" style="width:100%;">OK</button>');
                }, 400); 
            });
        };

        // [CORREÇÃO] Lógica do Reset (Estava faltando no seu código)
        document.getElementById('cfg-reset').onclick = () => {
            window.confirmModal('Zona de Perigo', 'Isso apagará TODOS os dados permanentemente. Deseja continuar?', () => {
                localStorage.clear();
                location.reload();
            });
        };
    };
}