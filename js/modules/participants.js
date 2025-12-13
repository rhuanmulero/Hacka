import { getEvents, getParticipants, addParticipant, deleteParticipant, updateParticipant } from '../core/state.js';

// --- ESTADO LOCAL ---
let currentEventId = null;
let searchTerm = '';
let filterStatus = 'todos';

export function renderParticipants(container) {
    const events = getEvents();

    // Validação: Se não tem eventos, não dá para ter participantes
    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento antes de gerenciar participantes.</div>`;
        return;
    }

    // Seleciona o primeiro evento por padrão se não houver seleção
    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    // 1. Estrutura HTML (Header + Filtros + Tabela)
    const html = `
        <header class="top-header" style="margin-bottom: 1.5rem;">
            <div>
                <h1>Participantes</h1>
                <p class="subtitle">Gestão de inscritos e check-in.</p>
            </div>
            
            <div style="display:flex; gap:0.5rem;">
                <button onclick="window.importCsvPrompt()" class="btn-text" style="display:flex; align-items:center; gap:5px;">
                    <span class="material-icons-round">upload_file</span> Importar
                </button>
                <button onclick="window.addParticipantPrompt()" class="btn-create">
                    <span class="material-icons-round">person_add</span> Novo Participante
                </button>
            </div>
        </header>

        <!-- BARRA DE FILTROS -->
        <div class="filter-bar">
            <!-- Seletor de Evento (O mais importante) -->
            <div style="border-right:1px solid #eee; padding-right:1rem; margin-right:0.5rem; display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO ATUAL</label>
                <select id="event-select" style="border:none; font-weight:700; font-size:1rem; color:var(--primary); outline:none; background:transparent; cursor:pointer; padding:0;" onchange="window.switchEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>

            <!-- Busca -->
            <div class="search-input-wrapper">
                <span class="material-icons-round">search</span>
                <input type="text" class="search-input" placeholder="Buscar por nome ou email..." 
                       onkeyup="window.handleSearchPart(this.value)" value="${searchTerm}">
            </div>

            <!-- Filtro de Status -->
            <select class="filter-select" onchange="window.handleStatusFilter(this.value)">
                <option value="todos" ${filterStatus === 'todos' ? 'selected' : ''}>Todos os Status</option>
                <option value="Inscrito">Inscrito</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Check-in">Check-in Realizado</option>
            </select>
        </div>

        <!-- TABELA -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email / Contato</th>
                        <th>Perfil</th>
                        <th>Status</th>
                        <th style="text-align:right">Ações</th>
                    </tr>
                </thead>
                <tbody id="participants-body">
                    <!-- Injetado via JS -->
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
    
    // 2. Renderiza os dados iniciais
    refreshTable();

    // --- FUNÇÕES GLOBAIS (WINDOW) ---

    // A. Trocar Evento
    window.switchEvent = (id) => {
        currentEventId = id; // O id vem como string do select
        refreshTable();
    };

    // B. Buscar (Input)
    window.handleSearchPart = (val) => {
        searchTerm = val.toLowerCase();
        refreshTable();
    };

    // C. Filtrar Status (Select)
    window.handleStatusFilter = (val) => {
        filterStatus = val;
        refreshTable();
    };

    // D. Adicionar Participante (Modal)
    window.addParticipantPrompt = () => {
        const body = `
            <label class="input-label">Nome Completo</label>
            <input type="text" id="p-name" class="big-input">
            
            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Email</label>
                    <input type="email" id="p-email" class="big-input">
                </div>
                <div class="input-group">
                    <label class="input-label">Perfil</label>
                    <select id="p-role" class="big-select">
                        <option>Desenvolvedor</option>
                        <option>Designer</option>
                        <option>Negócios</option>
                        <option>Visitante</option>
                        <option>Palestrante</option>
                    </select>
                </div>
            </div>
        `;
        
        const footer = `
            <button onclick="window.closeModal()" class="btn-text">Cancelar</button>
            <button id="btn-save-part" class="btn-create">Adicionar</button>
        `;

        window.openModal('Novo Participante', body, footer);
        setTimeout(() => document.getElementById('p-name').focus(), 100);

        document.getElementById('btn-save-part').onclick = () => {
            const name = document.getElementById('p-name').value;
            const email = document.getElementById('p-email').value;
            const role = document.getElementById('p-role').value;

            if(name && email) {
                addParticipant({
                    eventId: currentEventId, // Vincula ao evento selecionado na barra
                    name, email, role,
                    status: 'Inscrito'
                });
                window.closeModal();
                refreshTable();
            } else {
                alert("Nome e Email são obrigatórios.");
            }
        };
    };

    // E. Excluir Participante
    window.removeParticipant = (id) => {
        window.confirmModal('Excluir Participante', 'Tem certeza? Essa ação não pode ser desfeita.', () => {
            deleteParticipant(id);
            refreshTable();
        });
    };

    // F. Editar Status (Check-in, Confirmado, etc)
    window.editStatus = (id, current) => {
        const body = `
            <label class="input-label">Alterar Status para:</label>
            <select id="p-new-status" class="big-select">
                <option ${current==='Inscrito'?'selected':''}>Inscrito</option>
                <option ${current==='Confirmado'?'selected':''}>Confirmado</option>
                <option ${current==='Check-in'?'selected':''}>Check-in</option>
            </select>
        `;
        const footer = `<button id="btn-up-status" class="btn-create">Salvar</button>`;
        
        window.openModal('Gerenciar Status', body, footer);
        
        document.getElementById('btn-up-status').onclick = () => {
            const newStatus = document.getElementById('p-new-status').value;
            updateParticipant(id, { status: newStatus });
            window.closeModal();
            refreshTable();
        };
    };

    // G. Importar CSV (Placeholder)
    window.importCsvPrompt = () => {
        window.openModal('Importar CSV', 
            '<p>Funcionalidade de importação em desenvolvimento.</p><p style="color:#888; font-size:0.9rem">Em breve você poderá subir planilhas do Excel para cadastrar em massa.</p>', 
            '<button onclick="window.closeModal()" class="btn-create">Entendi</button>'
        );
    };
}

// --- FUNÇÃO AUXILIAR: FILTRA E DESENHA TABELA ---
function refreshTable() {
    const tbody = document.getElementById('participants-body');
    if (!tbody) return;

    // 1. Pega lista crua do evento atual (ID convertido para string na comparação do state se necessário, mas aqui assumimos compatibilidade)
    let list = getParticipants(currentEventId);

    // 2. Aplica Filtro de Texto
    if (searchTerm) {
        list = list.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.email.toLowerCase().includes(searchTerm)
        );
    }

    // 3. Aplica Filtro de Status
    if (filterStatus !== 'todos') {
        list = list.filter(p => p.status === filterStatus);
    }

    // 4. Renderiza
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color:#999;">Nenhum participante encontrado com esses filtros.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="avatar-small">${p.name.charAt(0).toUpperCase()}</div>
                    <strong>${p.name}</strong>
                </div>
            </td>
            <td style="color:#666;">${p.email}</td>
            <td><span class="badge-role">${p.role || 'Participante'}</span></td>
            <td>${getStatusBadge(p.status)}</td>
            <td style="text-align:right;">
                <button class="btn-icon-small" onclick="window.editStatus('${p.id}', '${p.status}')" title="Mudar Status"><span class="material-icons-round">cached</span></button>
                <button class="btn-icon-small delete" onclick="window.removeParticipant('${p.id}')" title="Excluir"><span class="material-icons-round">delete</span></button>
            </td>
        </tr>
    `).join('');
}

// --- HELPERS ---
function getStatusBadge(status) {
    const map = {
        'Inscrito': { color: '#e0e0e0', text: '#555', label: 'Inscrito' },
        'Confirmado': { color: '#fff3e0', text: '#ef6c00', label: 'Confirmado' },
        'Check-in': { color: '#e8f5e9', text: '#2e7d32', label: 'Check-in Realizado' }
    };
    const s = map[status] || map['Inscrito'];
    return `<span class="badge-status" style="background:${s.color}; color:${s.text}">${s.label}</span>`;
}