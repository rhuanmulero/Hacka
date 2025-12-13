// js/modules/dashboard.js
import { navigateTo } from '../core/router.js';
import { getEvents, getParticipants, getTransactions, getFeedbacks } from '../core/state.js';

export function renderDashboard(container) {
    const events = getEvents();
    
    // --- 1. CÁLCULOS GERAIS (GLOBAL) ---
    
    // Total de Eventos
    const totalEvents = events.length;
    
    // Próximos Eventos (Data futura)
    const nextEvents = events.filter(e => new Date(e.date) >= new Date()).length;

    // Receita Total (Soma de todas as entradas do Financeiro)
    // Precisamos varrer todos os eventos
    let totalRevenue = 0;
    let totalParticipants = 0;
    let totalCheckins = 0;
    let allFeedbacks = [];

    events.forEach(ev => {
        // Finanças
        const trans = getTransactions(ev.id);
        const income = trans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        totalRevenue += income;

        // Pessoas
        const parts = getParticipants(ev.id);
        totalParticipants += parts.length;
        totalCheckins += parts.filter(p => p.status === 'Check-in').length;

        // NPS
        const feeds = getFeedbacks(ev.id);
        allFeedbacks = [...allFeedbacks, ...feeds];
    });

    // Cálculo Média NPS Global
    let npsScore = 0;
    if (allFeedbacks.length > 0) {
        let promoters = allFeedbacks.filter(f => f.score >= 9).length;
        let detractors = allFeedbacks.filter(f => f.score <= 6).length;
        npsScore = Math.round(((promoters - detractors) / allFeedbacks.length) * 100);
    }

    // --- 2. RENDERIZAÇÃO ---

    const html = `
        <header class="top-header">
            <div>
                <h1>Visão Geral</h1>
                <p class="subtitle">Resumo executivo de todos os seus eventos.</p>
            </div>
            <button id="btn-new-event-dash" class="btn-create">
                <span class="material-icons-round">add</span> Novo Evento
            </button>
        </header>

        <!-- KPI GRID -->
        <div class="stats-grid">
            <!-- Eventos Ativos -->
            <div class="stat-card" onclick="window.navTo('agenda')" style="cursor:pointer">
                <div class="icon-box purple"><span class="material-icons-round">event</span></div>
                <div>
                    <h3>${nextEvents} <span style="font-size:0.9rem; color:#888; font-weight:400;">/ ${totalEvents}</span></h3>
                    <p>Eventos Próximos</p>
                </div>
            </div>

            <!-- Receita Global -->
            <div class="stat-card" onclick="window.navTo('financial')" style="cursor:pointer">
                <div class="icon-box green"><span class="material-icons-round">payments</span></div>
                <div>
                    <h3>R$ ${totalRevenue.toLocaleString('pt-BR', { notation: "compact" })}</h3>
                    <p>Receita Total</p>
                </div>
            </div>

            <!-- Pessoas Impactadas -->
            <div class="stat-card" onclick="window.navTo('participants')" style="cursor:pointer">
                <div class="icon-box pink"><span class="material-icons-round">groups</span></div>
                <div>
                    <h3>${totalParticipants}</h3>
                    <p>Inscritos Totais</p>
                </div>
            </div>

            <!-- Qualidade (NPS) -->
            <div class="stat-card" onclick="window.navTo('feedback')" style="cursor:pointer">
                <div class="icon-box" style="background:#FFF3E0; color:#EF6C00;"><span class="material-icons-round">sentiment_satisfied</span></div>
                <div>
                    <h3>${allFeedbacks.length > 0 ? npsScore : '-'}</h3>
                    <p>NPS Global</p>
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            
            <!-- LISTA DE EVENTOS RECENTES -->
            <section class="agenda-section">
                <div class="section-header">
                    <h2>Últimos Planejamentos</h2>
                    <a href="#" onclick="window.navTo('agenda'); return false;" class="link-view-all">Ver Todos</a>
                </div>
                <div class="events-list">
                    ${renderRecentList(events)}
                </div>
            </section>

            <!-- ATALHOS RÁPIDOS -->
            <section>
                <div class="section-header">
                    <h2>Acesso Rápido</h2>
                </div>
                <div style="background:white; border-radius:16px; padding:1.5rem; border:1px solid #eee;">
                    <button onclick="window.navTo('checkin')" class="btn-text" style="width:100%; text-align:left; padding:0.8rem; margin-bottom:0.5rem; background:#f9f9f9; border-radius:8px;">
                        <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; color:var(--primary);">qr_code_scanner</span>
                        Abrir Portaria
                    </button>
                    
                    <button onclick="window.navTo('external')" class="btn-text" style="width:100%; text-align:left; padding:0.8rem; margin-bottom:0.5rem; background:#f9f9f9; border-radius:8px;">
                        <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; color:#2E7D32;">badge</span>
                        Minha Atuação
                    </button>

                    <button onclick="window.navTo('wizard')" class="btn-text" style="width:100%; text-align:left; padding:0.8rem; background:#f9f9f9; border-radius:8px;">
                        <span class="material-icons-round" style="vertical-align:middle; margin-right:8px; color:#1565C0;">auto_awesome</span>
                        Criar com IA
                    </button>
                </div>
                
                <!-- Dica Pro -->
                <div style="margin-top:1.5rem; background:#E3F2FD; padding:1.2rem; border-radius:12px; color:#1565C0; font-size:0.9rem;">
                    <strong>💡 Dica:</strong> 
                    Use a aba <a href="#" onclick="window.navTo('marketing')" style="color:inherit; font-weight:700;">Campanhas</a> para gerar links de rastreamento para seus patrocinadores.
                </div>
            </section>
        </div>
    `;

    container.innerHTML = html;
    document.getElementById('btn-new-event-dash').onclick = () => navigateTo('wizard');
}

function renderRecentList(events) {
    if (events.length === 0) return `<div class="empty-state">Comece criando seu primeiro evento.</div>`;
    
    // Ordena por criação (ID mais novo primeiro) e pega os 4 primeiros
    return events
        .sort((a,b) => b.id - a.id)
        .slice(0, 4)
        .map(ev => `
        <div class="event-row">
            <div class="date-badge">
                <span>${new Date(ev.date).getDate()}</span>
                <small>${new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</small>
            </div>
            <div class="event-info">
                <h4>${ev.topic || 'Sem Nome'}</h4>
                <div style="display:flex; gap:0.5rem; margin-top:4px;">
                    <span class="tag">${ev.type}</span>
                    <span class="tag" style="background:#eee; color:#666">${ev.audience}</span>
                </div>
            </div>
            <div class="event-actions">
                <button onclick="window.navTo('agenda')" class="btn-icon"><span class="material-icons-round">arrow_forward</span></button>
            </div>
        </div>
    `).join('');
}