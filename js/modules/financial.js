import { getEvents, getTransactions, addTransaction, deleteTransaction } from '../core/state.js';

let currentEventId = null;

export function renderFinancial(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para gerenciar as finanças.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const transactions = getTransactions(currentEventId);
    const stats = calculateStats(transactions);

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Financeiro</h1>
                <p class="subtitle">Controle de orçamento e fluxo de caixa.</p>
            </div>
            <button onclick="window.addTransactionPrompt()" class="btn-create">
                <span class="material-icons-round">attach_money</span> Nova Transação
            </button>
        </header>

        <!-- BARRA DE SELEÇÃO DE EVENTO -->
        <div class="filter-bar" style="margin-bottom: 2rem;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">ORÇAMENTO DE:</label>
                <select id="event-select" style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer; padding:0;" onchange="window.switchFinEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- CARDS DE RESUMO (KPIs) -->
        <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card" style="border-bottom: 4px solid #4CAF50;">
                <div class="icon-box green"><span class="material-icons-round">arrow_upward</span></div>
                <div>
                    <h3 style="color:#2E7D32">${formatCurrency(stats.income)}</h3>
                    <p>Receitas (Entradas)</p>
                </div>
            </div>
            
            <div class="stat-card" style="border-bottom: 4px solid #F44336;">
                <div class="icon-box pink"><span class="material-icons-round">arrow_downward</span></div>
                <div>
                    <h3 style="color:#C62828">${formatCurrency(stats.expense)}</h3>
                    <p>Despesas (Saídas)</p>
                </div>
            </div>

            <div class="stat-card" style="border-bottom: 4px solid ${stats.balance >= 0 ? '#2196F3' : '#FF9800'};">
                <div class="icon-box purple"><span class="material-icons-round">account_balance_wallet</span></div>
                <div>
                    <h3 style="color:${stats.balance >= 0 ? '#1565C0' : '#E65100'}">${formatCurrency(stats.balance)}</h3>
                    <p>Saldo Líquido</p>
                </div>
            </div>
        </div>

        <!-- LISTA DE TRANSAÇÕES -->
        <div class="section-header">
            <h2>Histórico de Movimentações</h2>
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Data</th>
                        <th>Valor</th>
                        <th style="text-align:right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderRows(transactions)}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES GLOBAIS ---

    window.switchFinEvent = (id) => {
        currentEventId = id;
        renderFinancial(container);
    };

    window.addTransactionPrompt = () => {
        const body = `
            <div class="input-row">
                <div class="input-group">
                    <label class="input-label">Tipo</label>
                    <div class="selection-grid" style="grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:0;">
                        <div id="type-in" class="selection-card selected" onclick="window.selectFinType('income')" style="min-height:80px; padding:1rem;">
                            <span class="material-icons-round" style="font-size:1.5rem; margin:0; color:#4CAF50;">add_circle</span>
                            <h3 style="margin:0">Receita</h3>
                        </div>
                        <div id="type-out" class="selection-card" onclick="window.selectFinType('expense')" style="min-height:80px; padding:1rem;">
                            <span class="material-icons-round" style="font-size:1.5rem; margin:0; color:#F44336;">remove_circle</span>
                            <h3 style="margin:0">Despesa</h3>
                        </div>
                    </div>
                </div>
            </div>

            <label class="input-label" style="margin-top:1rem">Descrição</label>
            <input type="text" id="t-desc" class="big-input" placeholder="Ex: Patrocínio Microsoft">

            <div class="input-row" style="margin-top:1rem">
                <div class="input-group">
                    <label class="input-label">Valor (R$)</label>
                    <input type="number" id="t-value" class="big-input" placeholder="0.00">
                </div>
                <div class="input-group">
                    <label class="input-label">Categoria</label>
                    <select id="t-cat" class="big-select">
                        <option>Patrocínio</option>
                        <option>Ingressos</option>
                        <option>Infraestrutura</option>
                        <option>Marketing</option>
                        <option>Alimentação</option>
                        <option>Staff</option>
                        <option>Outros</option>
                    </select>
                </div>
            </div>
            <input type="hidden" id="t-type" value="income">
        `;

        const footer = `
            <button onclick="window.closeModal()" class="btn-text">Cancelar</button>
            <button id="btn-save-trans" class="btn-create">Salvar</button>
        `;

        window.openModal('Nova Movimentação', body, footer);

        // Lógica de seleção visual (Receita/Despesa)
        window.selectFinType = (type) => {
            document.getElementById('t-type').value = type;
            document.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
            
            if(type === 'income') document.getElementById('type-in').classList.add('selected');
            else document.getElementById('type-out').classList.add('selected');
        };

        document.getElementById('btn-save-trans').onclick = () => {
            const desc = document.getElementById('t-desc').value;
            const amount = parseFloat(document.getElementById('t-value').value);
            const category = document.getElementById('t-cat').value;
            const type = document.getElementById('t-type').value;

            if(desc && amount) {
                addTransaction({
                    eventId: currentEventId,
                    description: desc,
                    amount: amount,
                    category: category,
                    type: type,
                    date: new Date().toISOString()
                });
                window.closeModal();
                renderFinancial(container);
            } else {
                alert("Preencha descrição e valor.");
            }
        };
    };

    // --- AQUI ESTÁ A MUDANÇA PARA USAR O MODAL BONITO ---
    window.removeTransaction = (id) => {
        window.confirmModal(
            'Excluir Transação', 
            'Tem certeza que deseja apagar este registro financeiro? Isso afetará o cálculo do saldo.', 
            () => {
                deleteTransaction(id);
                renderFinancial(container);
            }
        );
    };
}

// --- HELPERS ---

function calculateStats(list) {
    let income = 0;
    let expense = 0;
    list.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
}

function formatCurrency(val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderRows(list) {
    if (list.length === 0) return `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999">Nenhuma movimentação registrada.</td></tr>`;

    return list.map(t => {
        const isIncome = t.type === 'income';
        const color = isIncome ? '#4CAF50' : '#F44336';
        const sign = isIncome ? '+' : '-';
        
        return `
        <tr>
            <td><strong>${t.description}</strong></td>
            <td><span class="tag" style="font-size:0.8rem">${t.category}</span></td>
            <td style="color:#666">${new Date(t.date).toLocaleDateString()}</td>
            <td style="font-weight:700; color:${color}">${sign} ${formatCurrency(t.amount)}</td>
            <td style="text-align:right">
                <button class="btn-icon-small delete" onclick="window.removeTransaction('${t.id}')"><span class="material-icons-round">delete</span></button>
            </td>
        </tr>
        `;
    }).join('');
}