// js/core/state.js

let events = JSON.parse(localStorage.getItem('hacka_events')) || [];
let kanbanData = JSON.parse(localStorage.getItem('hacka_kanban')) || { boards: {} };

export function getEvents() { return events; }

export function saveEvent(eventData) {
    const newEvent = {
        id: eventData.id || Date.now(),
        createdAt: eventData.createdAt || new Date().toISOString(),
        ...eventData
    };
    
    const index = events.findIndex(e => e.id === newEvent.id);
    if (index > -1) {
        events[index] = newEvent;
    } else {
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
    updateStorage();
}

// --- KANBAN CORRIGIDO ---

function createBoardForEvent(eventId, title) {
    kanbanData.boards[eventId] = {
        title: title,
        // NOMES CORRETOS E CORES VIBRANTES
        columns: [
            { id: 'c1', title: 'A Fazer', color: '#fbbf24' },      // Amarelo
            { id: 'c2', title: 'Em Progresso', color: '#3b82f6' }, // Azul
            { id: 'c3', title: 'Concluído', color: '#10b981' }     // Verde
        ],
        cards: []
    };
    updateKanbanStorage();
}

export function getKanbanData(boardId) {
    // Se não tiver ID, pega o primeiro ou cria o Geral Corrigido
    if (!boardId) {
        const keys = Object.keys(kanbanData.boards);
        if (keys.length === 0) {
            createBoardForEvent('geral', 'Tarefas Gerais');
            return kanbanData.boards['geral'];
        }
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

function updateStorage() { localStorage.setItem('hacka_events', JSON.stringify(events)); }
function updateKanbanStorage() { localStorage.setItem('hacka_kanban', JSON.stringify(kanbanData)); }