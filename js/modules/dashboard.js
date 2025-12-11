import { navigateTo } from '../core/router.js';
import { getEvents } from '../core/state.js';

export function renderDashboard(container) {
    const events = getEvents(); // Pega dados REAIS do localStorage
    
    const totalEvents = events.length;
    // Conta eventos futuros baseados na data real
    const nextEvents = events.filter(e => new Date(e.date) >= new Date()).length;
    
    // Lógica para Público Mais Frequente (Só mostra se tiver dados)
    let topAudience = "-";
    if (events.length > 0) {
        const audiences = events.map(e => e.audience);
        // Conta qual string aparece mais vezes
        topAudience = audiences.sort((a,b) =>
            audiences.filter(v => v===a).length - audiences.filter(v => v===b).length
        ).pop();
    }

    const html = `
        <header class="top-header">
            <div>
                <h1>Visão Geral</h1>
                <p class="subtitle">Bem-vindo ao painel de controle.</p>
            </div>
            <button id="btn-new-event-dash" class="btn-create">
                <span class="material-icons-round">add</span> Novo Evento
            </button>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="icon-box purple"><span class="material-icons-round">event</span></div>
                <div><h3>${totalEvents}</h3><p>Total Criado</p></div>
            </div>
            <div class="stat-card">
                <div class="icon-box pink"><span class="material-icons-round">upcoming</span></div>
                <div><h3>${nextEvents}</h3><p>Próximos</p></div>
            </div>
            <div class="stat-card">
                <div class="icon-box green"><span class="material-icons-round">groups</span></div>
                <div>
                    <h3 style="font-size:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${topAudience}</h3>
                    <p>Público Principal</p>
                </div>
            </div>
        </div>

        <section class="agenda-section">
            <div class="section-header">
                <h2>Últimos Planejamentos</h2>
                <a href="#" onclick="window.navTo('agenda'); return false;" class="link-view-all">Ver Agenda</a>
            </div>
            <div class="events-list">
                ${renderRecentList(events)}
            </div>
        </section>
    `;

    container.innerHTML = html;
    document.getElementById('btn-new-event-dash').onclick = () => navigateTo('wizard');
}

function renderRecentList(events) {
    if (events.length === 0) return `<div class="empty-state">Nenhum evento. Clique em "Novo Evento".</div>`;
    
    // Mostra os 3 mais recentes (baseado no ID/Data de criação)
    return events.slice(0, 3).map(ev => `
        <div class="event-row">
            <div class="date-badge">
                <span class="material-icons-round">event_note</span>
            </div>
            <div class="event-info">
                <h4>${ev.topic || 'Sem Nome'}</h4>
                <span class="tag">${ev.type}</span>
            </div>
            <div class="event-actions">
                <button onclick="window.navTo('agenda')" class="btn-icon"><span class="material-icons-round">arrow_forward</span></button>
            </div>
        </div>
    `).join('');
}