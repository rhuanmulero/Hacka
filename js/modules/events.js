import { getEvents, deleteEvent, saveEvent } from '../core/state.js';

export function renderEvents(container) {
    const events = getEvents();
    const today = new Date().toISOString().split('T')[0];
    const futureEvents = events.filter(e => e.date >= today);
    const pastEvents = events.filter(e => e.date < today);

    const html = `
        <header class="top-header">
            <div>
                <h1>Minha Agenda</h1>
                <p class="subtitle">Gerencie e visualize seus planejamentos.</p>
            </div>
            <div class="tabs">
                <button id="tab-btn-future" class="tab-btn active" onclick="window.switchTab('future')">Próximos (${futureEvents.length})</button>
                <button id="tab-btn-past" class="tab-btn" onclick="window.switchTab('past')">Realizados (${pastEvents.length})</button>
            </div>
        </header>

        <section id="tab-future" class="events-list">
            ${renderList(futureEvents, 'Nenhum evento futuro agendado.')}
        </section>

        <section id="tab-past" class="events-list hidden">
            ${renderList(pastEvents, 'Nenhum evento realizado ainda.')}
        </section>
    `;

    container.innerHTML = html;

    window.switchTab = (tab) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-btn-${tab}`).classList.add('active');
        document.querySelectorAll('.events-list').forEach(l => l.classList.add('hidden'));
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
    };

    window.toggleDetails = (id) => {
        const el = document.getElementById(`details-${id}`);
        const icon = document.getElementById(`icon-${id}`);
        
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
            icon.innerText = 'expand_less';
        } else {
            el.classList.add('hidden');
            icon.innerText = 'expand_more';
        }
    };
    
    // --- MUDANÇA: USANDO O NOVO MODAL ---
    window.removeEventAction = (id) => {
        window.confirmModal('Excluir Evento', 'Deseja excluir este evento permanentemente? O quadro de tarefas associado também será apagado.', () => {
            deleteEvent(id);
            const root = document.getElementById('app-root');
            renderEvents(root);
        });
    };

    window.editEventAction = (id) => {
        const ev = events.find(e => e.id === id);
        if(!ev) return;

        const body = `
            <label class="input-label">Nome do Evento</label>
            <input type="text" id="edit-topic" class="big-input" value="${ev.topic}">
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group"><label class="input-label">Data</label><input type="date" id="edit-date" class="big-input" value="${ev.date}"></div>
                <div class="input-group"><label class="input-label">Público</label><input type="text" id="edit-audience" class="big-input" value="${ev.audience}"></div>
            </div>
        `;
        const footer = `<button onclick="window.closeModal()" class="btn-text">Cancelar</button><button id="btn-update" class="btn-create">Salvar</button>`;
        
        window.openModal('Editar Evento', body, footer);
        
        document.getElementById('btn-update').onclick = () => {
            ev.topic = document.getElementById('edit-topic').value;
            ev.date = document.getElementById('edit-date').value;
            ev.audience = document.getElementById('edit-audience').value;
            saveEvent(ev);
            window.closeModal();
            renderEvents(container);
        };
    };
}

function renderList(list, emptyMsg) {
    if (list.length === 0) return `<div class="empty-state">${emptyMsg}</div>`;

    return list.map(ev => `
        <div class="event-card-wrapper" style="margin-bottom: 1rem;">
            <div class="event-row" onclick="window.toggleDetails(${ev.id})" style="cursor: pointer;">
                <div class="date-badge">
                    <span>${ev.date ? new Date(ev.date).getDate() : '?'}</span>
                    <small>${ev.date ? new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase() : '-'}</small>
                </div>
                <div class="event-info">
                    <h4>${ev.topic || ev.type}</h4>
                    <span class="tag">${ev.type}</span>
                    <span class="tag" style="background:#fff3e0; color:#e65100">${ev.audience}</span>
                </div>
                <div class="event-actions">
                    <button onclick="event.stopPropagation(); window.editEventAction(${ev.id})" class="btn-icon" title="Editar"><span class="material-icons-round">edit</span></button>
                    <button onclick="event.stopPropagation(); window.removeEventAction(${ev.id})" class="btn-icon delete" title="Excluir"><span class="material-icons-round">delete</span></button>
                    <button class="btn-icon"><span class="material-icons-round" id="icon-${ev.id}">expand_more</span></button>
                </div>
            </div>
            <div id="details-${ev.id}" class="event-details hidden">
                ${ev.fullStrategy ? ev.fullStrategy : '<div style="padding:1rem; color:red;">⚠️ Estratégia não encontrada.</div>'}
            </div>
        </div>
    `).join('');
}