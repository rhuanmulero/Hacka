// js/core/state.js

let events = JSON.parse(localStorage.getItem('hacka_events')) || [];
let kanbanData = JSON.parse(localStorage.getItem('hacka_kanban')) || { boards: {} };
// NOVO: Array de Participantes
let participants = JSON.parse(localStorage.getItem('hacka_participants')) || [];

export function getEvents() { return events; }

export function saveEvent(eventData) {
    const newEvent = {
        id: eventData.id || Date.now(),
        createdAt: eventData.createdAt || new Date().toISOString(),
        ...eventData
    };
    const index = events.findIndex(e => e.id === newEvent.id);
    if (index > -1) events[index] = newEvent;
    else {
        events.unshift(newEvent);
        createBoardForEvent(newEvent.id, newEvent.topic);
    }
    updateStorage();
    return newEvent;
}

export function deleteEvent(id) {
    events = events.filter(ev => ev.id !== id);
    if (kanbanData.boards[id]) {
        delete kanbanData.boards[id];
        updateKanbanStorage();
    }
    // Opcional: Deletar participantes deste evento também? Por segurança, mantemos por enquanto.
    updateStorage();
}

// --- KANBAN ---
function createBoardForEvent(eventId, title) {
    kanbanData.boards[eventId] = {
        title: title,
        columns: [
            { id: 'c1', title: 'A Fazer', color: '#fbbf24' },
            { id: 'c2', title: 'Em Progresso', color: '#3b82f6' },
            { id: 'c3', title: 'Concluído', color: '#10b981' }
        ],
        cards: []
    };
    updateKanbanStorage();
}

export function getKanbanData(boardId) {
    if (!boardId) {
        const keys = Object.keys(kanbanData.boards);
        if (keys.length === 0) return null;
        return kanbanData.boards[keys[0]];
    }
    return kanbanData.boards[boardId];
}

export function updateKanbanBoard(boardId, data) {
    kanbanData.boards[boardId] = data;
    updateKanbanStorage();
}

export function getAllBoardsSummary() {
    return Object.keys(kanbanData.boards).map(key => ({
        id: key,
        title: kanbanData.boards[key].title
    }));

    
}

// --- PARTICIPANTES (NOVO) ---

export function getParticipants(eventId) {
    if(!eventId) return [];
    return participants.filter(p => p.eventId == eventId);
}

export function addParticipant(data) {
    const newP = { id: 'p'+Date.now(), ...data };
    participants.unshift(newP);
    updateParticipantsStorage();
    return newP;
}

export function updateParticipant(id, newData) {
    const index = participants.findIndex(p => p.id === id);
    if(index > -1) {
        participants[index] = { ...participants[index], ...newData };
        updateParticipantsStorage();
    }
}

export function deleteParticipant(id) {
    participants = participants.filter(p => p.id !== id);
    updateParticipantsStorage();
}

let transactions = JSON.parse(localStorage.getItem('hacka_finance')) || [];

export function getTransactions(eventId) {
    if (!eventId) return [];
    // Retorna ordenado por data (mais recente primeiro)
    return transactions
        .filter(t => t.eventId == eventId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addTransaction(data) {
    const newT = { id: 't' + Date.now(), createdAt: new Date(), ...data };
    transactions.unshift(newT);
    localStorage.setItem('hacka_finance', JSON.stringify(transactions));
    return newT;
}

export function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('hacka_finance', JSON.stringify(transactions));

    
}

// --- GESTÃO DE TIMES (NOVO) ---
let teams = JSON.parse(localStorage.getItem('hacka_teams')) || [];

export function getTeams(eventId) {
    if (!eventId) return [];
    return teams.filter(t => t.eventId == eventId);
}

export function addTeam(data) {
    const newTeam = { 
        id: 'team_' + Date.now(), 
        members: [], // Array de IDs de participantes
        ...data 
    };
    teams.unshift(newTeam);
    localStorage.setItem('hacka_teams', JSON.stringify(teams));
    return newTeam;
}

export function deleteTeam(id) {
    teams = teams.filter(t => t.id !== id);
    localStorage.setItem('hacka_teams', JSON.stringify(teams));
}

export function addMemberToTeam(teamId, participantId) {
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex > -1) {
        if (!teams[teamIndex].members.includes(participantId)) {
            teams[teamIndex].members.push(participantId);
            localStorage.setItem('hacka_teams', JSON.stringify(teams));
        }
    }
}

export function removeMemberFromTeam(teamId, participantId) {
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex > -1) {
        teams[teamIndex].members = teams[teamIndex].members.filter(id => id !== participantId);
        localStorage.setItem('hacka_teams', JSON.stringify(teams));
    }
}

// --- INTEGRAÇÃO IA -> KANBAN (A Mágica) ---
export function autoCreateTasksFromStrategy(eventId, strategyHTML) {
    // Usa o navegador para ler o HTML gerado pela IA
    const parser = new DOMParser();
    const doc = parser.parseFromString(strategyHTML, 'text/html');
    
    // Recupera ou cria o board do evento
    let board = kanbanData.boards[eventId];
    if (!board) return; // Board deve ter sido criado ao salvar o evento

    // Pega todos os itens de lista (<li>) da estratégia
    const listItems = doc.querySelectorAll('li');
    
    listItems.forEach(li => {
        // Limpa o texto (remove colchetes se a IA colocar)
        const text = li.textContent.replace(/\[.*?\]/g, '').trim();
        
        if (text.length > 5) {
            board.cards.push({
                id: 'ai_task_' + Math.random().toString(36).substr(2, 9),
                colId: 'c1', // Joga na coluna "A Fazer"
                title: text,
                tag: 'Sugestão IA'
            });
        }
    });
    
    updateKanbanStorage();
}

// --- MARKETING / CAMPANHAS ---
let campaigns = JSON.parse(localStorage.getItem('hacka_campaigns')) || [];

export function getCampaigns(eventId) {
    if (!eventId) return [];
    return campaigns.filter(c => c.eventId == eventId);
}

export function addCampaign(data) {
    const newCamp = { 
        id: 'camp_' + Date.now(), 
        status: 'Ativa', // Ativa, Pausada, Concluída
        clicks: 0,
        conversions: 0,
        spent: 0,
        ...data 
    };
    campaigns.unshift(newCamp);
    updateCampaignsStorage();
    return newCamp;
}

export function deleteCampaign(id) {
    campaigns = campaigns.filter(c => c.id !== id);
    updateCampaignsStorage();
}

export function updateCampaignStats(id, newStats) {
    const index = campaigns.findIndex(c => c.id === id);
    if (index > -1) {
        campaigns[index] = { ...campaigns[index], ...newStats };
        updateCampaignsStorage();
    }
}

// --- FORNECEDORES ---
let suppliers = JSON.parse(localStorage.getItem('hacka_suppliers')) || [];

export function getSuppliers(eventId) {
    if (!eventId) return [];
    return suppliers.filter(s => s.eventId == eventId);
}

export function addSupplier(data) {
    const newSup = { 
        id: 'sup_' + Date.now(), 
        status: 'Em Negociação', // Em Negociação, Contratado, Pago
        ...data 
    };
    suppliers.unshift(newSup);
    updateSuppliersStorage();
    return newSup;
}

export function deleteSupplier(id) {
    suppliers = suppliers.filter(s => s.id !== id);
    updateSuppliersStorage();
}

export function updateSupplierStatus(id, newStatus) {
    const index = suppliers.findIndex(s => s.id === id);
    if (index > -1) {
        suppliers[index].status = newStatus;
        updateSuppliersStorage();
    }
}

function updateSuppliersStorage() { localStorage.setItem('hacka_suppliers', JSON.stringify(suppliers)); }

function updateCampaignsStorage() { localStorage.setItem('hacka_campaigns', JSON.stringify(campaigns)); }

// --- INGRESSOS (TICKETS) ---
let tickets = JSON.parse(localStorage.getItem('hacka_tickets')) || [];

export function getTickets(eventId) {
    if (!eventId) return [];
    return tickets.filter(t => t.eventId == eventId);
}

export function addTicket(data) {
    const newTicket = { 
        id: 'tick_' + Date.now(), 
        sold: 0, // Começa com zero vendas
        ...data 
    };
    tickets.push(newTicket);
    updateTicketsStorage();
    return newTicket;
}

export function deleteTicket(id) {
    tickets = tickets.filter(t => t.id !== id);
    updateTicketsStorage();
}

// Função para incrementar venda (usaremos na Landing Page depois)
export function sellTicket(ticketId) {
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index > -1) {
        if (tickets[index].sold < tickets[index].quantity) {
            tickets[index].sold++;
            updateTicketsStorage();
            return true;
        }
    }
    return false; // Esgotado
}

// --- AGENDA / SESSÕES ---
let sessions = JSON.parse(localStorage.getItem('hacka_sessions')) || [];

export function getSessions(eventId) {
    if (!eventId) return [];
    // Retorna ordenado por horário
    return sessions
        .filter(s => s.eventId == eventId)
        .sort((a, b) => a.time.localeCompare(b.time));
}

export function addSession(data) {
    const newSession = { 
        id: 'sess_' + Date.now(), 
        ...data 
    };
    sessions.push(newSession);
    updateSessionsStorage();
    return newSession;
}

export function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    updateSessionsStorage();
}

function updateSessionsStorage() { localStorage.setItem('hacka_sessions', JSON.stringify(sessions)); }

function updateTicketsStorage() { localStorage.setItem('hacka_tickets', JSON.stringify(tickets)); }

// --- FEEDBACK / NPS ---
let feedbacks = JSON.parse(localStorage.getItem('hacka_feedbacks')) || [];

export function getFeedbacks(eventId) {
    if (!eventId) return [];
    return feedbacks.filter(f => f.eventId == eventId);
}

// Salvar um voto (virá da página pública)
export function addFeedback(eventId, score, comment) {
    const newFeed = {
        id: 'feed_' + Date.now(),
        eventId: eventId,
        score: parseInt(score),
        comment: comment || '',
        date: new Date().toISOString()
    };
    feedbacks.unshift(newFeed);
    localStorage.setItem('hacka_feedbacks', JSON.stringify(feedbacks));
}

// --- MEUS LEADS (Quando atuo como Expositor) ---
let myLeads = JSON.parse(localStorage.getItem('hacka_my_leads')) || [];

export function getMyLeads(eventId) {
    if (!eventId) return [];
    return myLeads.filter(l => l.eventId == eventId);
}

export function addMyLead(eventId, name, email, notes) {
    const newLead = {
        id: 'lead_' + Date.now(),
        eventId: eventId,
        name,
        email,
        notes,
        capturedAt: new Date().toISOString()
    };
    myLeads.unshift(newLead);
    localStorage.setItem('hacka_my_leads', JSON.stringify(myLeads));
    return newLead;
}

// --- STORAGE UPDATES ---
function updateStorage() { localStorage.setItem('hacka_events', JSON.stringify(events)); }
function updateKanbanStorage() { localStorage.setItem('hacka_kanban', JSON.stringify(kanbanData)); }
function updateParticipantsStorage() { localStorage.setItem('hacka_participants', JSON.stringify(participants)); }