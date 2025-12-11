import { getKanbanData, updateKanbanBoard, getAllBoardsSummary } from '../core/state.js';

let currentBoardId = null;
let boardData = null;

export function renderKanban(container) {
    const boardsList = getAllBoardsSummary();
    
    if (!boardsList || boardsList.length === 0) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; color:#888;">
                <span class="material-icons-round" style="font-size:4rem; opacity:0.3; margin-bottom:1rem">dashboard_customize</span>
                <h2>Nenhum Quadro Encontrado</h2>
                <p>Os quadros são criados automaticamente quando você adiciona um Evento.</p>
                <button onclick="window.navTo('wizard')" class="btn-create" style="margin-top:1rem">Criar Primeiro Evento</button>
            </div>
        `;
        return;
    }
    
    if (!currentBoardId || !boardsList.find(b => b.id === currentBoardId)) {
        currentBoardId = boardsList[0].id;
    }
    
    boardData = getKanbanData(currentBoardId);

    // Auto-reparo
    if (boardData) {
        if (!boardData.columns) boardData.columns = [
            { id: 'todo', title: 'A Fazer', color: '#fbbf24' },
            { id: 'doing', title: 'Em Andamento', color: '#3b82f6' },
            { id: 'done', title: 'Concluído', color: '#10b981' }
        ];
        if (!boardData.cards) boardData.cards = [];
        
        boardData.columns = boardData.columns.map(col => typeof col === 'string' ? { id: col, title: col, color: '#ccc' } : col);
        boardData.columns.forEach((col, idx) => { if(!col.title) col.title = col.label || `Coluna ${idx}`; });
    } else {
        container.innerHTML = '<div class="empty-state">Erro de dados.</div>';
        return;
    }

    const html = `
        <header class="top-header" style="margin-bottom: 1rem;">
            <div style="display:flex; align-items:center; gap:1rem;">
                <div>
                    <h1>Tarefas</h1>
                    <p class="subtitle">Gestão visual do projeto.</p>
                </div>
                
                <div class="board-selector">
                    <span class="material-icons-round">folder_open</span>
                    <select id="board-select" onchange="window.switchBoard(this.value)">
                        ${boardsList.map(b => `<option value="${b.id}" ${b.id == currentBoardId ? 'selected' : ''}>${b.title}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div style="display:flex; gap:1rem; align-items:center;">
                <!-- BOTÃO CLARO DE NOVA COLUNA -->
                <button onclick="window.addColumnPrompt()" class="btn-text" style="display:flex; align-items:center; gap:5px; font-weight:600;">
                    <span class="material-icons-round">view_column</span> + Coluna
                </button>
                
                <button onclick="window.addCardPrompt()" class="btn-create">
                    <span class="material-icons-round">add</span> Nova Tarefa
                </button>
            </div>
        </header>

        <div class="kanban-wrapper">
            <div class="kanban-board" id="kanban-area">
                ${renderColumns()}
            </div>
        </div>
    `;

    container.innerHTML = html;
    setupDragAndDrop();
}

function renderColumns() {
    return boardData.columns.map(col => {
        const cards = boardData.cards.filter(c => c.colId === col.id);
        return `
            <div class="kanban-column" data-col="${col.id}">
                <div class="column-header" style="border-top-color: ${col.color || '#ccc'}">
                    <div style="display:flex; justify-content:space-between; width:100%">
                        <span>${col.title}</span>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <span class="count">${cards.length}</span>
                            <span class="material-icons-round remove-col-btn" onclick="window.removeColumn('${col.id}')" title="Excluir Coluna">close</span>
                        </div>
                    </div>
                </div>
                <div class="column-body">
                    ${cards.map(card => `
                        <div class="kanban-card" draggable="true" id="${card.id}">
                            <div class="card-tag">${card.tag || 'Geral'}</div>
                            <p>${card.title}</p>
                            <span class="material-icons-round delete-card-btn" onclick="window.deleteCard('${card.id}')">delete</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// --- AÇÕES COM MODAIS CUSTOMIZADOS ---

window.switchBoard = (id) => {
    currentBoardId = id;
    renderKanban(document.getElementById('app-root'));
};

window.addColumnPrompt = () => {
    window.promptModal('Nova Coluna', 'Nome da Coluna:', (name) => {
        boardData.columns.push({ 
            id: 'col_' + Date.now(), 
            title: name, 
            color: '#'+Math.floor(Math.random()*16777215).toString(16) 
        });
        saveAndRender();
    });
};

window.removeColumn = (colId) => {
    window.confirmModal('Excluir Coluna', 'Tem certeza? Todas as tarefas nesta coluna serão perdidas.', () => {
        boardData.columns = boardData.columns.filter(c => c.id !== colId);
        // Opcional: limpar cards órfãos
        boardData.cards = boardData.cards.filter(c => c.colId !== colId);
        saveAndRender();
    });
};

window.addCardPrompt = () => {
    if(!boardData.columns.length) {
        // Alerta bonito em vez de nativo
        return window.openModal('Atenção', '<p>Você precisa criar uma coluna antes de adicionar tarefas.</p>', '<button onclick="window.closeModal()" class="btn-create">Entendi</button>');
    }

    const body = `
        <label class="input-label">Título</label>
        <input type="text" id="c-title" class="big-input">
        <label class="input-label" style="margin-top:1rem">Coluna</label>
        <select id="c-col" class="big-select">
            ${boardData.columns.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
        </select>
    `;
    const footer = `<button onclick="window.saveCard()" class="btn-create">Salvar</button>`;
    
    window.openModal('Nova Tarefa', body, footer);
    setTimeout(() => document.getElementById('c-title').focus(), 100);
    
    window.saveCard = () => {
        const title = document.getElementById('c-title').value;
        const col = document.getElementById('c-col').value;
        if(title) {
            boardData.cards.push({ id: 'c'+Date.now(), colId: col, title, tag: 'Geral' });
            saveAndRender();
            window.closeModal();
        }
    };
};

window.deleteCard = (id) => {
    window.confirmModal('Excluir Tarefa', 'Confirma a exclusão desta tarefa?', () => {
        boardData.cards = boardData.cards.filter(c => c.id !== id);
        saveAndRender();
    });
};

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            const parentCol = card.parentElement.parentElement;
            const newColId = parentCol.getAttribute('data-col');
            const cData = boardData.cards.find(c => c.id === card.id);
            if(cData && cData.colId !== newColId) {
                cData.colId = newColId;
                updateKanbanBoard(currentBoardId, boardData);
            }
        });
    });

    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            const container = col.querySelector('.column-body');
            const draggable = document.querySelector('.dragging');
            container.appendChild(draggable);
        });
    });
}

function saveAndRender() {
    updateKanbanBoard(currentBoardId, boardData);
    renderKanban(document.getElementById('app-root'));
}