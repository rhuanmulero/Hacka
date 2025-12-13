// js/modules/suppliers.js
import { getEvents, getSuppliers, addSupplier, deleteSupplier, updateSupplierStatus } from '../core/state.js';

let currentEventId = null;

export function renderSuppliers(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para gerenciar fornecedores.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const suppliers = getSuppliers(currentEventId);
    
    // Total contratado (Soma dos fornecedores marcados como Contratado ou Pago)
    const hiredTotal = suppliers
        .filter(s => s.status !== 'Em Negociação')
        .reduce((acc, s) => acc + (parseFloat(s.cost) || 0), 0);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Fornecedores</h1>
                <p class="subtitle">Gestão de contratos, contatos e serviços.</p>
            </div>
            <button onclick="window.addSupplierPrompt()" class="btn-create">
                <span class="material-icons-round">add_business</span> Novo Fornecedor
            </button>
        </header>

        <!-- FILTRO E KPI -->
        <div class="filter-bar" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchSupEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
            
            <div style="text-align:right;">
                <span style="font-size:0.8rem; color:#888; display:block;">Total Comprometido</span>
                <span style="font-size:1.2rem; font-weight:700; color:var(--primary);">R$ ${hiredTotal.toLocaleString('pt-BR')}</span>
            </div>
        </div>

        <!-- GRID DE CARDS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${renderSupplierCards(suppliers)}
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---

    window.switchSupEvent = (id) => {
        currentEventId = id;
        renderSuppliers(container);
    };

    window.addSupplierPrompt = () => {
        const body = `
            <label class="input-label">Empresa / Nome</label>
            <input type="text" id="sup-name" class="big-input" placeholder="Ex: Buffet Delícia">
            
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Categoria</label>
                    <select id="sup-cat" class="big-select">
                        <option>Alimentação & Bebidas</option>
                        <option>Audiovisual & Som</option>
                        <option>Local / Espaço</option>
                        <option>Segurança & Limpeza</option>
                        <option>Brindes & Material</option>
                        <option>Outros</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">Custo Estimado (R$)</label>
                    <input type="number" id="sup-cost" class="big-input" placeholder="0.00">
                </div>
            </div>

            <label class="input-label" style="margin-top:1rem">Contato (Tel/Email)</label>
            <input type="text" id="sup-contact" class="big-input" placeholder="(11) 99999-9999">
        `;
        const footer = `<button id="btn-save-sup" class="btn-create">Salvar Fornecedor</button>`;
        
        window.openModal('Novo Fornecedor', body, footer);

        document.getElementById('btn-save-sup').onclick = () => {
            const name = document.getElementById('sup-name').value;
            const category = document.getElementById('sup-cat').value;
            const cost = parseFloat(document.getElementById('sup-cost').value);
            const contact = document.getElementById('sup-contact').value;

            if(name) {
                addSupplier({ eventId: currentEventId, name, category, cost, contact });
                window.closeModal();
                renderSuppliers(container);
            }
        };
    };

    window.changeSupStatus = (id, currentStatus) => {
        const nextStatus = {
            'Em Negociação': 'Contratado',
            'Contratado': 'Pago',
            'Pago': 'Em Negociação' // Ciclo
        };
        updateSupplierStatus(id, nextStatus[currentStatus]);
        renderSuppliers(container);
    };

    window.deleteSupplierAction = (id) => {
        window.confirmModal('Remover Fornecedor', 'Tem certeza que deseja apagar este contato?', () => {
            deleteSupplier(id);
            renderSuppliers(container);
        });
    };
}

function renderSupplierCards(list) {
    if (list.length === 0) return `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#999; border: 2px dashed #eee; border-radius:12px;">Nenhum fornecedor cadastrado.</div>`;

    return list.map(s => {
        const statusConfig = getStatusConfig(s.status);
        const categoryIcon = getCategoryIcon(s.category);

        return `
            <div class="stat-card" style="display:block; padding:0; overflow:hidden; position:relative;">
                <!-- Header Colorido -->
                <div style="background:${statusConfig.bg}; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div style="background:rgba(255,255,255,0.9); width:35px; height:35px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#555;">
                            <span class="material-icons-round" style="font-size:1.2rem;">${categoryIcon}</span>
                        </div>
                        <span style="font-weight:700; color:${statusConfig.text}; font-size:0.9rem;">${s.status}</span>
                    </div>
                    <button class="btn-icon-small" onclick="window.deleteSupplierAction('${s.id}')" style="background:rgba(255,255,255,0.5);">
                        <span class="material-icons-round" style="font-size:1rem; color:#d32f2f;">delete</span>
                    </button>
                </div>

                <!-- Corpo do Card -->
                <div style="padding:1.2rem;">
                    <h3 style="margin-bottom:0.2rem; font-size:1.1rem;">${s.name}</h3>
                    <p style="color:#888; font-size:0.85rem; margin-bottom:1rem;">${s.category}</p>

                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:0.5rem; color:#555; font-size:0.9rem;">
                        <span class="material-icons-round" style="font-size:1rem; color:#aaa;">phone</span>
                        ${s.contact || 'Sem contato'}
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; color:#555; font-size:0.9rem;">
                        <span class="material-icons-round" style="font-size:1rem; color:#aaa;">attach_money</span>
                        R$ ${s.cost ? s.cost.toLocaleString('pt-BR') : '0,00'}
                    </div>
                </div>

                <!-- Footer com Ação -->
                <div style="padding:0.8rem 1.2rem; border-top:1px solid #f0f0f0; background:#fafafa;">
                    <button onclick="window.changeSupStatus('${s.id}', '${s.status}')" 
                        style="width:100%; border:1px solid #ddd; background:#fff; padding:0.5rem; border-radius:6px; cursor:pointer; font-weight:600; color:#555; transition:0.2s;">
                        Mudar para: ${getNextStatusLabel(s.status)}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helpers Visuais
function getStatusConfig(status) {
    if (status === 'Contratado') return { bg: '#E3F2FD', text: '#1565C0' }; // Azul
    if (status === 'Pago') return { bg: '#E8F5E9', text: '#2E7D32' };       // Verde
    return { bg: '#FFF3E0', text: '#EF6C00' };                              // Laranja (Em Negociação)
}

function getNextStatusLabel(current) {
    if (current === 'Em Negociação') return 'Contratado 🖊️';
    if (current === 'Contratado') return 'Pago 💰';
    return 'Em Negociação 🤝';
}

function getCategoryIcon(cat) {
    if (cat.includes('Alimentação')) return 'restaurant';
    if (cat.includes('Audiovisual')) return 'speaker_group';
    if (cat.includes('Local')) return 'apartment';
    if (cat.includes('Segurança')) return 'security';
    if (cat.includes('Brindes')) return 'card_giftcard';
    return 'store';
}