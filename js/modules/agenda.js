// js/modules/agenda.js
import { getEvents, getSessions, addSession, deleteSession } from '../core/state.js';

let currentEventId = null;

export function renderAgendaBuilder(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para montar a grade.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const sessions = getSessions(currentEventId);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Grade de Programação</h1>
                <p class="subtitle">Palestras, workshops e intervalos.</p>
            </div>
            <button onclick="window.addSessionPrompt()" class="btn-create">
                <span class="material-icons-round">schedule</span> Nova Atividade
            </button>
        </header>

        <div class="filter-bar">
             <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchAgendaEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:100px">Horário</th>
                        <th>Atividade</th>
                        <th>Palestrante / Responsável</th>
                        <th style="text-align:right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderSessionRows(sessions)}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---

    window.switchAgendaEvent = (id) => {
        currentEventId = id;
        renderAgendaBuilder(container);
    };

    window.addSessionPrompt = () => {
        const body = `
            <div class="input-row">
                <div class="input-group">
                    <label class="input-label">Horário (Início)</label>
                    <input type="time" id="s-time" class="big-input">
                </div>
                <div class="input-group">
                    <label class="input-label">Tipo</label>
                    <select id="s-tag" class="big-select">
                        <option>Palestra</option>
                        <option>Workshop</option>
                        <option>Networking</option>
                        <option>Coffee Break</option>
                        <option>Painel</option>
                    </select>
                </div>
            </div>
            
            <label class="input-label" style="margin-top:1rem">Título da Atividade</label>
            <input type="text" id="s-title" class="big-input" placeholder="Ex: O Futuro da IA">

            <label class="input-label" style="margin-top:1rem">Palestrante / Descrição</label>
            <input type="text" id="s-desc" class="big-input" placeholder="Ex: Dr. Fulano de Tal">
        `;
        
        const footer = `<button id="btn-save-session" class="btn-create">Adicionar à Grade</button>`;
        window.openModal('Nova Atividade', body, footer);

        document.getElementById('btn-save-session').onclick = () => {
            const time = document.getElementById('s-time').value;
            const title = document.getElementById('s-title').value;
            const desc = document.getElementById('s-desc').value;
            const tag = document.getElementById('s-tag').value;

            if(time && title) {
                addSession({ eventId: currentEventId, time, title, desc, tag });
                window.closeModal();
                renderAgendaBuilder(container);
            } else {
                alert("Horário e Título são obrigatórios.");
            }
        };
    };

    window.deleteSessionAction = (id) => {
        if(confirm('Remover esta atividade?')) {
            deleteSession(id);
            renderAgendaBuilder(container);
        }
    };
}

function renderSessionRows(sessions) {
    if(sessions.length === 0) return `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#999">Nenhuma atividade cadastrada.</td></tr>`;

    return sessions.map(s => `
        <tr>
            <td style="font-weight:700; color:var(--primary);">${s.time}</td>
            <td>
                <div style="font-weight:600;">${s.title}</div>
                <span class="tag" style="font-size:0.7rem; margin-top:4px;">${s.tag}</span>
            </td>
            <td style="color:#666;">${s.desc}</td>
            <td style="text-align:right;">
                <button class="btn-icon-small delete" onclick="window.deleteSessionAction('${s.id}')"><span class="material-icons-round">delete</span></button>
            </td>
        </tr>
    `).join('');
}