// js/modules/external.js
import { getEvents, getSessions, addMyLead, getMyLeads } from '../core/state.js';

let currentEventId = null;
let currentRole = 'speaker'; // speaker, exhibitor, sponsor

export function renderExternal(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Nenhum evento disponível.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Minha Atuação</h1>
                <p class="subtitle">Área do Convidado, Palestrante e Expositor.</p>
            </div>
            
            <div style="background:#fff; padding:0.5rem 1rem; border-radius:12px; border:1px solid #eee;">
                <select style="border:none; font-weight:700; font-size:0.9rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchExtEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </header>

        <!-- SELETOR DE PAPEL (ROLE) -->
        <div class="tabs" style="margin-bottom: 2rem; justify-content: flex-start;">
            <button class="tab-btn ${currentRole === 'speaker' ? 'active' : ''}" onclick="window.switchRole('speaker')">Sou Palestrante</button>
            <button class="tab-btn ${currentRole === 'exhibitor' ? 'active' : ''}" onclick="window.switchRole('exhibitor')">Sou Expositor</button>
            <button class="tab-btn ${currentRole === 'sponsor' ? 'active' : ''}" onclick="window.switchRole('sponsor')">Sou Patrocinador</button>
        </div>

        <!-- CONTEÚDO DINÂMICO -->
        <div id="role-content" class="animate-fade">
            ${getRoleContent(currentRole)}
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---

    window.switchExtEvent = (id) => { currentEventId = id; renderExternal(container); };
    
    window.switchRole = (role) => { 
        currentRole = role; 
        renderExternal(container); 
    };

    // AÇÕES DE PALESTRANTE
    window.uploadPresentation = () => {
        // Simula upload
        const btn = document.getElementById('btn-upload');
        btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px; display:inline-block; vertical-align:middle;"></span> Enviando...';
        setTimeout(() => {
            alert('✅ Apresentação enviada para a organização!');
            btn.innerHTML = '<span class="material-icons-round">check</span> Enviado com Sucesso';
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
        }, 1500);
    };

    // AÇÕES DE EXPOSITOR
    window.saveLead = () => {
        const name = document.getElementById('lead-name').value;
        const email = document.getElementById('lead-email').value;
        const notes = document.getElementById('lead-notes').value;

        if(name) {
            addMyLead(currentEventId, name, email, notes);
            renderExternal(container); // Recarrega para mostrar na lista
        }
    };
}

function getRoleContent(role) {
    if (role === 'speaker') return renderSpeakerView();
    if (role === 'exhibitor') return renderExhibitorView();
    if (role === 'sponsor') return renderSponsorView();
}

// --- VISÃO 1: PALESTRANTE ---
function renderSpeakerView() {
    // Tenta achar sessões (mock ou reais)
    const sessions = getSessions(currentEventId).slice(0, 2); 
    
    return `
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:2rem;">
            <div>
                <h3 style="margin-bottom:1rem;">Minha Agenda</h3>
                ${sessions.length > 0 ? sessions.map(s => `
                    <div class="event-row" style="cursor:default;">
                        <div class="date-badge" style="background:var(--primary-light); color:var(--primary);">
                            <span class="material-icons-round" style="font-size:1.5rem;">mic</span>
                        </div>
                        <div class="event-info">
                            <h4>${s.title}</h4>
                            <p style="font-size:0.9rem; color:#666;">${s.time} • Palco Principal</p>
                        </div>
                    </div>
                `).join('') : '<p style="color:#888;">Nenhuma palestra vinculada ao seu perfil.</p>'}
            </div>

            <div class="stat-card" style="display:block; text-align:center;">
                <div class="icon-box purple" style="margin:0 auto 1rem auto; width:60px; height:60px;">
                    <span class="material-icons-round" style="font-size:2rem;">cloud_upload</span>
                </div>
                <h3>Material de Apoio</h3>
                <p style="color:#666; font-size:0.9rem; margin-bottom:1.5rem;">Envie seus slides (PPT/PDF) até 2h antes.</p>
                <button id="btn-upload" onclick="window.uploadPresentation()" class="btn-create" style="width:100%; justify-content:center;">
                    Selecionar Arquivo
                </button>
            </div>
        </div>
    `;
}

// --- VISÃO 2: EXPOSITOR (COLETOR DE LEADS) ---
function renderExhibitorView() {
    const leads = getMyLeads(currentEventId);

    return `
        <div style="display:grid; grid-template-columns: 350px 1fr; gap:2rem;">
            
            <!-- FORMULÁRIO DE CAPTURA -->
            <div style="background:white; padding:1.5rem; border-radius:16px; border:1px solid #eee;">
                <h3 style="margin-bottom:1rem; display:flex; align-items:center; gap:10px;">
                    <span class="material-icons-round" style="color:var(--primary);">qr_code_scanner</span>
                    Novo Lead
                </h3>
                <input type="text" id="lead-name" class="big-input" placeholder="Nome do Visitante" style="margin-top:0;">
                <input type="email" id="lead-email" class="big-input" placeholder="Email / WhatsApp">
                <textarea id="lead-notes" class="big-input" rows="3" placeholder="Interesse / Notas..."></textarea>
                <button onclick="window.saveLead()" class="btn-create" style="width:100%; justify-content:center; margin-top:1rem;">
                    Salvar Contato
                </button>
            </div>

            <!-- LISTA DE LEADS CAPTURADOS -->
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Meus Contatos (${leads.length})</h3>
                    <button class="btn-text" style="color:#2E7D32;" onclick="alert('CSV exportado (simulação)')">
                        <span class="material-icons-round" style="font-size:1rem; margin-right:5px;">download</span> Exportar
                    </button>
                </div>
                
                <div style="background:white; border-radius:16px; border:1px solid #eee; overflow:hidden;">
                    ${leads.length === 0 ? '<div style="padding:2rem; text-align:center; color:#999;">Nenhum lead coletado hoje.</div>' : 
                    leads.map(l => `
                        <div style="padding:1rem; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between;">
                            <div>
                                <div style="font-weight:700;">${l.name}</div>
                                <div style="font-size:0.85rem; color:#666;">${l.email}</div>
                                ${l.notes ? `<div style="font-size:0.8rem; color:#888; margin-top:4px;">Nota: ${l.notes}</div>` : ''}
                            </div>
                            <div style="font-size:0.75rem; color:#aaa;">${new Date(l.capturedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- VISÃO 3: PATROCINADOR ---
function renderSponsorView() {
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="icon-box pink"><span class="material-icons-round">visibility</span></div>
                <div><h3>1,240</h3><p>Visualizações da Marca</p></div>
            </div>
            <div class="stat-card">
                <div class="icon-box green"><span class="material-icons-round">ads_click</span></div>
                <div><h3>85</h3><p>Cliques no Banner</p></div>
            </div>
            <div class="stat-card">
                <div class="icon-box purple"><span class="material-icons-round">star</span></div>
                <div><h3>4.8/5</h3><p>Avaliação do Stand</p></div>
            </div>
        </div>

        <div style="background:white; padding:2rem; border-radius:16px; border:1px solid #eee; text-align:center; margin-top:2rem;">
            <span class="material-icons-round" style="font-size:3rem; color:#ccc; margin-bottom:1rem;">image</span>
            <h3>Gerenciar Ativos</h3>
            <p style="color:#666; max-width:400px; margin:0 auto 1.5rem;">
                Certifique-se que sua logomarca e vídeo institucional estão atualizados para exibição nos telões.
            </p>
            <button class="btn-text" style="border:1px solid #ddd;">Atualizar Logo</button>
        </div>
    `;
}