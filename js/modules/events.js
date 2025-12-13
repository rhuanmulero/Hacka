import { getEvents, deleteEvent, saveEvent } from '../core/state.js';
import { openLandingPage } from './landing.js';

// --- ESTADO LOCAL DA TELA ---
// Variáveis fora da função principal para manter o estado
// quando a lista for atualizada (ex: ao excluir um item).
let currentTab = 'future';
let searchTerm = '';
let filterType = 'todos';

export function renderEvents(container) {
    // 1. Estrutura HTML Fixa (Header + Filtros + Container da Lista)
    const html = `
        <header class="top-header">
            <div>
                <h1>Minha Agenda</h1>
                <p class="subtitle">Gerencie e visualize seus planejamentos.</p>
            </div>
            <div class="tabs">
                <button id="tab-btn-future" class="tab-btn ${currentTab === 'future' ? 'active' : ''}" onclick="window.switchTab('future')">Próximos</button>
                <button id="tab-btn-past" class="tab-btn ${currentTab === 'past' ? 'active' : ''}" onclick="window.switchTab('past')">Realizados</button>
            </div>
        </header>

        <!-- BARRA DE FILTROS INTELIGENTE -->
        <div class="filter-bar">
            <div class="search-input-wrapper">
                <span class="material-icons-round">search</span>
                <input type="text" class="search-input" placeholder="Buscar evento por nome..." 
                       onkeyup="window.handleSearchEvent(this.value)" value="${searchTerm}">
            </div>
            
            <select class="filter-select" onchange="window.handleTypeFilter(this.value)">
                <option value="todos" ${filterType === 'todos' ? 'selected' : ''}>Todos os Tipos</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Conferência">Conferência</option>
                <option value="Meetup">Meetup</option>
                <option value="Outro">Outro</option>
            </select>
        </div>

        <!-- ONDE A LISTA SERÁ INJETADA -->
        <section id="events-container" class="events-list">
            <!-- O conteúdo será carregado via JS -->
        </section>
    `;

    container.innerHTML = html;
    
    // 2. Renderiza a lista inicial
    refreshList();

    // --- DEFINIÇÃO DAS AÇÕES GLOBAIS (WINDOW) ---
    // Necessário porque os onclicks estão no HTML como strings

    // A. Trocar Abas (Futuro / Passado)
    window.switchTab = (tab) => {
        currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-btn-${tab}`).classList.add('active');
        refreshList();
    };

    // B. Pesquisar (Input de Texto)
    window.handleSearchEvent = (val) => {
        searchTerm = val.toLowerCase();
        refreshList();
    };

    // C. Filtrar por Tipo (Select)
    window.handleTypeFilter = (val) => {
        filterType = val;
        refreshList();
    };

    // D. Expandir/Recolher Detalhes (Estratégia Interna)
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
    
    // E. Ver Site (Landing Page)
    window.viewSiteAction = (id) => {
        const events = getEvents();
        const ev = events.find(e => e.id === id);
        if(ev) {
            openLandingPage(ev);
        }
    };

    // F. Editar Evento (Modal Completo)
    window.editEventAction = (id) => {
        const events = getEvents();
        const ev = events.find(e => e.id === id);
        if(!ev) return;

        const body = `
            <label class="input-label">Nome do Evento</label>
            <input type="text" id="edit-topic" class="big-input" value="${ev.topic}">
            
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Data</label>
                    <input type="date" id="edit-date" class="big-input" value="${ev.date}">
                </div>
                <div class="input-group">
                    <label class="input-label">Público Alvo</label>
                    <input type="text" id="edit-audience" class="big-input" value="${ev.audience}">
                </div>
            </div>
             <div class="input-group" style="margin-top:1rem">
                <label class="input-label">Tipo</label>
                <select id="edit-type" class="big-select">
                    <option ${ev.type === 'Hackathon' ? 'selected' : ''}>Hackathon</option>
                    <option ${ev.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                    <option ${ev.type === 'Conferência' ? 'selected' : ''}>Conferência</option>
                    <option ${ev.type === 'Meetup' ? 'selected' : ''}>Meetup</option>
                    <option ${ev.type === 'Outro' ? 'selected' : ''}>Outro</option>
                </select>
            </div>
        `;
        
        const footer = `
            <button onclick="window.closeModal()" class="btn-text">Cancelar</button>
            <button id="btn-update-event" class="btn-create">Salvar Alterações</button>
        `;

        window.openModal('Editar Evento', body, footer);

        document.getElementById('btn-update-event').onclick = () => {
            // Atualiza objeto
            ev.topic = document.getElementById('edit-topic').value;
            ev.date = document.getElementById('edit-date').value;
            ev.audience = document.getElementById('edit-audience').value;
            ev.type = document.getElementById('edit-type').value;
            
            saveEvent(ev); // Salva no state/localStorage
            window.closeModal();
            refreshList(); // Atualiza a lista na tela
        };
    };

    // G. Excluir Evento
    window.removeEventAction = (id) => {
        window.confirmModal('Excluir Evento', 'Deseja excluir este evento permanentemente? O quadro de tarefas associado também será apagado.', () => {
            deleteEvent(id);
            refreshList();
        });
    };
}

// --- FUNÇÃO AUXILIAR: FILTRA E DESENHA A LISTA ---
function refreshList() {
    const container = document.getElementById('events-container');
    if(!container) return;

    const events = getEvents();
    const today = new Date().toISOString().split('T')[0];

    // 1. Aplica Filtros
    let filtered = events.filter(e => {
        // Filtro de Data (Aba)
        const isFuture = e.date >= today;
        if (currentTab === 'future' && !isFuture) return false;
        if (currentTab === 'past' && isFuture) return false;
        
        // Filtro de Texto (Busca)
        if (searchTerm && !e.topic.toLowerCase().includes(searchTerm)) return false;
        
        // Filtro de Tipo (Select)
        if (filterType !== 'todos' && e.type !== filterType) return false;

        return true;
    });

    // 2. Verifica se está vazio
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">Nenhum evento encontrado com os filtros atuais.</div>`;
        return;
    }

    // 3. Gera HTML dos Cards
    container.innerHTML = filtered.map(ev => `
        <div class="event-card-wrapper" style="margin-bottom: 1rem;">
            <!-- Card Principal (Clicável para expandir) -->
            <div class="event-row" onclick="window.toggleDetails(${ev.id})" style="cursor: pointer;">
                
                <div class="date-badge">
                    <span>${ev.date ? new Date(ev.date).getDate() : '?'}</span>
                    <small>${ev.date ? new Date(ev.date).toLocaleString('default', { month: 'short' }).toUpperCase() : '-'}</small>
                </div>
                
                <div class="event-info">
                    <h4>${ev.topic || ev.type}</h4>
                    <div style="display:flex; gap:0.5rem; margin-top:4px;">
                        <span class="tag">${ev.type}</span>
                        <span class="tag" style="background:#fff3e0; color:#e65100">${ev.audience}</span>
                    </div>
                </div>
                
                <div class="event-actions">
                    <!-- Botão Site -->
                    <button onclick="event.stopPropagation(); window.viewSiteAction(${ev.id})" class="btn-icon" title="Ver Landing Page" style="color:var(--primary);">
                        <span class="material-icons-round">public</span>
                    </button>

                    <!-- Botão Editar -->
                    <button onclick="event.stopPropagation(); window.editEventAction(${ev.id})" class="btn-icon" title="Editar">
                        <span class="material-icons-round">edit</span>
                    </button>
                    
                    <!-- Botão Excluir -->
                    <button onclick="event.stopPropagation(); window.removeEventAction(${ev.id})" class="btn-icon delete" title="Excluir">
                        <span class="material-icons-round">delete</span>
                    </button>
                    
                    <!-- Botão Expandir -->
                    <button class="btn-icon">
                        <span class="material-icons-round" id="icon-${ev.id}">expand_more</span>
                    </button>
                </div>
            </div>
            
            <!-- Detalhes Expansíveis (HTML da IA - Estratégia Interna) -->
            <div id="details-${ev.id}" class="event-details hidden">
                ${ev.fullStrategy ? extractInternalStrategy(ev.fullStrategy) : '<div style="padding:1rem; color:#888;">⚠️ Estratégia não encontrada.</div>'}
            </div>
        </div>
    `).join('');
}

// Pequeno helper para limpar o JSON do site da visualização interna e mostrar só a estratégia
function extractInternalStrategy(html) {
    // Se tiver o JSON escondido do site, a gente esconde ele visualmente ou remove
    // Como o JSON está numa div display:none, ele já não aparece, então podemos retornar o HTML direto.
    // Mas para garantir que não quebre layout:
    return html; 
}