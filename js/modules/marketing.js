// js/modules/marketing.js
import { getEvents, getCampaigns, addCampaign, deleteCampaign, updateCampaignStats } from '../core/state.js';

let currentEventId = null;

export function renderMarketing(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para gerenciar campanhas de marketing.</div>`;
        return;
    }

    // Seleciona evento padrão
    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const campaigns = getCampaigns(currentEventId);
    
    // Cálculos de Totais (Simulando um Dashboard Real)
    const totalBudget = campaigns.reduce((acc, c) => acc + (parseFloat(c.budget) || 0), 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Campanhas</h1>
                <p class="subtitle">Gestão de tráfego, email marketing e redes sociais.</p>
            </div>
            <button onclick="window.createCampaignPrompt()" class="btn-create">
                <span class="material-icons-round">campaign</span> Nova Campanha
            </button>
        </header>

        <!-- FILTRO DE EVENTO -->
        <div class="filter-bar" style="margin-bottom: 2rem;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchMktEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- KPIs GERAIS -->
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
            <div class="stat-card">
                <div class="icon-box purple"><span class="material-icons-round">payments</span></div>
                <div>
                    <h3 style="color:var(--primary)">R$ ${totalSpent.toLocaleString('pt-BR')}</h3>
                    <p style="font-size:0.85rem">Gasto / R$ ${totalBudget.toLocaleString('pt-BR')}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="icon-box pink"><span class="material-icons-round">ads_click</span></div>
                <div>
                    <h3>${campaigns.reduce((a,c)=>a+c.clicks,0)}</h3>
                    <p>Total de Cliques</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="icon-box green"><span class="material-icons-round">how_to_reg</span></div>
                <div>
                    <h3>${totalConversions}</h3>
                    <p>Conversões (Inscritos)</p>
                </div>
            </div>
        </div>

        <!-- GRID DE CAMPANHAS -->
        <h3 style="margin-bottom:1rem; font-size:1.1rem;">Campanhas Ativas</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
            ${renderCampaignCards(campaigns)}
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---
    
    window.switchMktEvent = (id) => {
        currentEventId = id;
        renderMarketing(container);
    };

    window.createCampaignPrompt = () => {
        const body = `
            <label class="input-label">Nome da Campanha</label>
            <input type="text" id="cp-name" class="big-input" placeholder="Ex: Lançamento Instagram">
            
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Canal</label>
                    <select id="cp-channel" class="big-select">
                        <option value="Instagram">Instagram / Facebook</option>
                        <option value="LinkedIn">LinkedIn Ads</option>
                        <option value="Email">Email Marketing</option>
                        <option value="Google">Google Search</option>
                        <option value="Influencer">Influenciadores</option>
                    </select>
                </div>
                <div class="input-group">
                    <label class="input-label">Orçamento (R$)</label>
                    <input type="number" id="cp-budget" class="big-input" placeholder="1000">
                </div>
            </div>
        `;
        const footer = `<button id="btn-save-cp" class="btn-create">Lançar Campanha</button>`;
        
        window.openModal('Nova Campanha', body, footer);

        document.getElementById('btn-save-cp').onclick = () => {
            const name = document.getElementById('cp-name').value;
            const channel = document.getElementById('cp-channel').value;
            const budget = document.getElementById('cp-budget').value;

            if(name && budget) {
                addCampaign({ eventId: currentEventId, name, channel, budget });
                window.closeModal();
                renderMarketing(container);
            }
        };
    };

    window.deleteCampaignAction = (id) => {
        window.confirmModal('Excluir Campanha', 'Os dados de performance serão perdidos.', () => {
            deleteCampaign(id);
            renderMarketing(container);
        });
    };

    // SIMULADOR DE DADOS (Magic Wand)
    // Isso simula o software buscando dados de APIs reais (Meta/Google)
    window.simulateData = (id) => {
        const camp = campaigns.find(c => c.id === id);
        if(!camp) return;

        // Gera números aleatórios para parecer real
        const newClicks = Math.floor(Math.random() * 50) + 10;
        const newConv = Math.floor(newClicks * 0.1); // 10% conversão
        const cost = Math.floor(Math.random() * 100);

        updateCampaignStats(id, {
            clicks: (camp.clicks || 0) + newClicks,
            conversions: (camp.conversions || 0) + newConv,
            spent: (camp.spent || 0) + cost
        });
        
        renderMarketing(container);
    };
}

function renderCampaignCards(list) {
    if (list.length === 0) return `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:#999;">Nenhuma campanha ativa.</div>`;

    return list.map(c => {
        const percentSpent = Math.min(100, Math.round((c.spent / c.budget) * 100)) || 0;
        const icon = getChannelIcon(c.channel);
        
        return `
            <div class="stat-card" style="display:block; padding:1.2rem; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div class="icon-box" style="width:40px; height:40px; background:#f5f5f5; color:#555;">
                            <span class="material-icons-round" style="font-size:1.2rem">${icon}</span>
                        </div>
                        <div>
                            <h4 style="font-size:1rem; margin:0;">${c.name}</h4>
                            <small style="color:#888;">${c.channel}</small>
                        </div>
                    </div>
                    <button class="btn-icon-small delete" onclick="window.deleteCampaignAction('${c.id}')">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>

                <!-- Barra de Progresso do Orçamento -->
                <div style="margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                        <span>Gasto: R$ ${c.spent}</span>
                        <span>Orçamento: R$ ${c.budget}</span>
                    </div>
                    <div style="width:100%; height:6px; background:#eee; border-radius:4px; overflow:hidden;">
                        <div style="width:${percentSpent}%; height:100%; background:${percentSpent > 90 ? '#ef5350' : 'var(--primary)'}; transition:0.3s;"></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; padding-top:10px; border-top:1px solid #f0f0f0;">
                    <div style="text-align:center;">
                        <span style="display:block; font-weight:700; font-size:1.1rem;">${c.clicks}</span>
                        <span style="font-size:0.75rem; color:#888;">Cliques</span>
                    </div>
                    <div style="text-align:center;">
                        <span style="display:block; font-weight:700; font-size:1.1rem; color:#4CAF50;">${c.conversions}</span>
                        <span style="font-size:0.75rem; color:#888;">Conversões</span>
                    </div>
                </div>

                <!-- Botão de Simulação -->
                <button onclick="window.simulateData('${c.id}')" title="Atualizar Dados (Simulação)" 
                    style="width:100%; margin-top:1rem; background:#fafafa; border:1px solid #eee; padding:0.5rem; border-radius:6px; cursor:pointer; color:var(--primary); font-size:0.8rem; font-weight:600; display:flex; justify-content:center; gap:5px; align-items:center;">
                    <span class="material-icons-round" style="font-size:1rem;">refresh</span> Atualizar Métricas
                </button>
            </div>
        `;
    }).join('');
}

function getChannelIcon(channel) {
    const map = {
        'Instagram': 'photo_camera',
        'Facebook': 'facebook',
        'LinkedIn': 'business',
        'Email': 'mail',
        'Google': 'search',
        'Influencer': 'star'
    };
    return map[channel] || 'campaign';
}