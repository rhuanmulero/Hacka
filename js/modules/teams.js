import { getEvents, getTeams, addTeam, deleteTeam, getParticipants, addMemberToTeam, removeMemberFromTeam } from '../core/state.js';

let currentEventId = null;

export function renderTeams(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para gerenciar times.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const teamList = getTeams(currentEventId);
    const participants = getParticipants(currentEventId);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Times & Projetos</h1>
                <p class="subtitle">Formação de equipes e mentoria.</p>
            </div>
            <button onclick="window.createTeamPrompt()" class="btn-create">
                <span class="material-icons-round">group_add</span> Criar Time
            </button>
        </header>

        <div class="filter-bar" style="margin-bottom: 2rem;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select id="event-select-teams" style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchTeamEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="teams-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${renderTeamCards(teamList, participants)}
        </div>
    `;

    container.innerHTML = html;

    // Funções Globais
    window.switchTeamEvent = (id) => { currentEventId = id; renderTeams(container); };

    window.createTeamPrompt = () => {
        const body = `
            <label class="input-label">Nome do Time</label>
            <input type="text" id="team-name" class="big-input" placeholder="Ex: Rocket Alpha">
            <label class="input-label" style="margin-top:1rem">Categoria</label>
            <select id="team-cat" class="big-select">
                <option>Inovação</option><option>Social</option><option>Fintech</option><option>Health</option>
            </select>
        `;
        const footer = `<button id="btn-save-team" class="btn-create">Criar</button>`;
        window.openModal('Novo Time', body, footer);
        
        document.getElementById('btn-save-team').onclick = () => {
            const name = document.getElementById('team-name').value;
            const cat = document.getElementById('team-cat').value;
            if(name) {
                addTeam({ eventId: currentEventId, name, category: cat });
                window.closeModal();
                renderTeams(container);
            }
        };
    };

    window.deleteTeamAction = (id) => {
        window.confirmModal('Dissolver Time', 'Tem certeza?', () => { deleteTeam(id); renderTeams(container); });
    };

    window.manageMembers = (teamId) => {
        const team = getTeams(currentEventId).find(t => t.id === teamId);
        const allParts = getParticipants(currentEventId);
        const members = allParts.filter(p => team.members.includes(p.id));
        const available = allParts.filter(p => !team.members.includes(p.id));

        const body = `
            <div style="background:#f9f9f9; padding:1rem; border-radius:8px; margin-bottom:1rem;">
                <h4 style="margin-bottom:0.5rem; font-size:0.9rem;">Membros Atuais</h4>
                ${members.length ? members.map(m => `
                    <div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid #eee;">
                        <span>${m.name}</span>
                        <span style="color:red; cursor:pointer;" onclick="window.removeMember('${team.id}', '${m.id}')">×</span>
                    </div>`).join('') : '<p style="color:#999; font-size:0.8rem">Vazio</p>'}
            </div>
            <label class="input-label">Adicionar Participante</label>
            <div style="display:flex; gap:0.5rem;">
                <select id="sel-add" class="big-select" style="margin:0;">
                    ${available.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
                <button onclick="window.addMember('${team.id}')" class="btn-create" style="padding:0 1.5rem;">+</button>
            </div>
        `;
        window.openModal(`Time: ${team.name}`, body);
    };

    window.addMember = (tid) => {
        const pid = document.getElementById('sel-add').value;
        if(pid) { addMemberToTeam(tid, pid); window.manageMembers(tid); renderTeams(container); }
    };
    window.removeMember = (tid, pid) => {
        removeMemberFromTeam(tid, pid); window.manageMembers(tid); renderTeams(container);
    };
}

function renderTeamCards(teams, parts) {
    if (teams.length === 0) return `<div style="grid-column:1/-1; text-align:center; color:#999; padding:2rem;">Nenhum time.</div>`;
    return teams.map(t => `
        <div class="stat-card" style="display:block; padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <div class="icon-box" style="background:#E3F2FD; color:#1565C0;"><span class="material-icons-round">rocket_launch</span></div>
                <button class="btn-icon" onclick="window.deleteTeamAction('${t.id}')"><span class="material-icons-round">more_vert</span></button>
            </div>
            <h3>${t.name}</h3>
            <span class="tag">${t.category}</span>
            <div style="margin-top:1.5rem; display:flex; justify-content:space-between; align-items:center;">
                <small style="color:#666">${t.members.length} membros</small>
                <button onclick="window.manageMembers('${t.id}')" class="btn-icon-small"><span class="material-icons-round">edit</span></button>
            </div>
        </div>
    `).join('');
}