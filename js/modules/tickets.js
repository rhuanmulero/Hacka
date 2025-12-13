// js/modules/tickets.js
import { getEvents, getTickets, addTicket, deleteTicket } from '../core/state.js';

let currentEventId = null;

export function renderTickets(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para definir ingressos.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const tickets = getTickets(currentEventId);
    
    // KPIs
    const totalCapacity = tickets.reduce((acc, t) => acc + parseInt(t.quantity), 0);
    const potentialRevenue = tickets.reduce((acc, t) => acc + (parseInt(t.quantity) * parseFloat(t.price)), 0);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Ingressos & Lotes</h1>
                <p class="subtitle">Defina preços, quantidades e gerencie as vendas.</p>
            </div>
            <button onclick="window.createTicketPrompt()" class="btn-create">
                <span class="material-icons-round">local_activity</span> Criar Lote
            </button>
        </header>

        <!-- BARRA DE KPI -->
        <div class="filter-bar" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchTicketEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
            
            <div style="display:flex; gap:2rem; text-align:right;">
                <div>
                    <span style="font-size:0.8rem; color:#888; display:block;">Capacidade Total</span>
                    <span style="font-size:1.2rem; font-weight:700; color:var(--text-main);">${totalCapacity} vagas</span>
                </div>
                <div>
                    <span style="font-size:0.8rem; color:#888; display:block;">Potencial de Receita</span>
                    <span style="font-size:1.2rem; font-weight:700; color:#4CAF50;">R$ ${potentialRevenue.toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </div>

        <!-- GRID DE TICKETS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${renderTicketCards(tickets)}
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---

    window.switchTicketEvent = (id) => {
        currentEventId = id;
        renderTickets(container);
    };

    window.createTicketPrompt = () => {
        const body = `
            <label class="input-label">Nome do Lote</label>
            <input type="text" id="tk-name" class="big-input" placeholder="Ex: Lote Promocional / VIP">
            
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Quantidade</label>
                    <input type="number" id="tk-qtd" class="big-input" placeholder="100">
                </div>
                <div class="input-group">
                    <label class="input-label">Preço (R$)</label>
                    <input type="number" id="tk-price" class="big-input" placeholder="0 para Gratuito">
                </div>
            </div>
        `;
        const footer = `<button id="btn-save-ticket" class="btn-create">Salvar Lote</button>`;
        
        window.openModal('Novo Ingresso', body, footer);

        document.getElementById('btn-save-ticket').onclick = () => {
            const name = document.getElementById('tk-name').value;
            const quantity = parseInt(document.getElementById('tk-qtd').value);
            const price = parseFloat(document.getElementById('tk-price').value || 0);

            if(name && quantity > 0) {
                addTicket({ eventId: currentEventId, name, quantity, price });
                window.closeModal();
                renderTickets(container);
            } else {
                alert('Preencha nome e quantidade válida.');
            }
        };
    };

    window.deleteTicketAction = (id) => {
        window.confirmModal('Excluir Lote', 'Se excluir, este ingresso não aparecerá mais na página de vendas.', () => {
            deleteTicket(id);
            renderTickets(container);
        });
    };
}

function renderTicketCards(list) {
    if (list.length === 0) return `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#999; border: 2px dashed #eee; border-radius:12px;">Nenhum ingresso configurado.</div>`;

    return list.map(t => {
        const percentSold = Math.round((t.sold / t.quantity) * 100);
        const isFree = parseFloat(t.price) === 0;

        return `
            <div class="stat-card" style="display:block; padding:1.5rem; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div class="icon-box" style="background:#FFF3E0; color:#EF6C00;">
                            <span class="material-icons-round">confirmation_number</span>
                        </div>
                        <div>
                            <h3 style="font-size:1.1rem; margin:0;">${t.name}</h3>
                            <span style="font-weight:700; color:${isFree ? '#2E7D32' : '#555'};">
                                ${isFree ? 'GRATUITO' : `R$ ${parseFloat(t.price).toFixed(2)}`}
                            </span>
                        </div>
                    </div>
                    <button class="btn-icon-small delete" onclick="window.deleteTicketAction('${t.id}')">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>

                <!-- Barra de Vendas -->
                <div style="margin-top:1.5rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px; color:#666;">
                        <span>Vendidos: <b>${t.sold}</b></span>
                        <span>Total: <b>${t.quantity}</b></span>
                    </div>
                    <div style="width:100%; height:8px; background:#eee; border-radius:4px; overflow:hidden;">
                        <div style="width:${percentSold}%; height:100%; background:var(--primary); transition:0.3s;"></div>
                    </div>
                    <div style="text-align:right; font-size:0.75rem; color:#aaa; margin-top:4px;">${percentSold}% esgotado</div>
                </div>
            </div>
        `;
    }).join('');
}