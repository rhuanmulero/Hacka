// js/modules/feedback.js
import { getEvents, getFeedbacks } from '../core/state.js';

let currentEventId = null;

export function renderFeedback(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para medir a satisfação (NPS).</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const feedbacks = getFeedbacks(currentEventId);
    
    // --- CÁLCULOS ROBUSTOS ---
    let promoters = 0;
    let detractors = 0;
    let passives = 0;
    let sumScore = 0;

    feedbacks.forEach(f => {
        const score = parseInt(f.score); // Garante que é número
        sumScore += score;

        if (score >= 9) promoters++;       // 9 e 10
        else if (score <= 6) detractors++; // 0 a 6
        else passives++;                   // 7 e 8
    });

    const total = feedbacks.length;
    let npsScore = 0;
    let averageScore = 0;

    if (total > 0) {
        // Cálculo NPS: %Promotores - %Detratores
        npsScore = Math.round(((promoters - detractors) / total) * 100);
        
        // Cálculo Média: Soma / Total
        averageScore = (sumScore / total).toFixed(1);
    }

    // Definição de Cores e Níveis
    let npsColor = '#aaa';
    let npsLabel = 'Sem dados';

    if (total > 0) {
        if (npsScore >= 75) { npsColor = '#2E7D32'; npsLabel = 'Excelente'; }
        else if (npsScore >= 50) { npsColor = '#4CAF50'; npsLabel = 'Muito Bom'; }
        else if (npsScore >= 0) { npsColor = '#FFC107'; npsLabel = 'Aperfeiçoamento'; }
        else { npsColor = '#F44336'; npsLabel = 'Crítico'; }
    }

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Pesquisa de Satisfação</h1>
                <p class="subtitle">Métricas de fidelidade e qualidade do evento.</p>
            </div>
            <button onclick="window.openSurveyLink()" class="btn-create">
                <span class="material-icons-round">link</span> Abrir Pesquisa
            </button>
        </header>

        <div class="filter-bar">
             <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchFeedEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- DASHBOARD DUPLO -->
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            
            <!-- 1. CARTÃO NPS (O OFICIAL) -->
            <div style="background:white; padding:1.5rem; border-radius:16px; border:1px solid #eee; text-align:center; position:relative; overflow:hidden;">
                <span style="font-size:0.8rem; color:#888; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:0.5rem;">NPS (Fidelidade)</span>
                <span style="font-size:3.5rem; font-weight:800; color:${npsColor}; line-height:1;">${npsScore}</span>
                <span style="display:block; font-size:0.9rem; font-weight:700; color:${npsColor}; margin-top:5px; margin-bottom:1rem;">${npsLabel}</span>
                
                <div style="display:flex; justify-content:center; gap:15px; font-size:0.75rem; color:#666; background:#f9f9f9; padding:10px; border-radius:8px;">
                    <span title="Promotores (9-10)">😊 ${promoters}</span>
                    <span title="Passivos (7-8)">😐 ${passives}</span>
                    <span title="Detratores (0-6)">😡 ${detractors}</span>
                </div>
            </div>

            <!-- 2. CARTÃO MÉDIA (A REALIDADE) -->
            <div style="background:white; padding:1.5rem; border-radius:16px; border:1px solid #eee; text-align:center;">
                <span style="font-size:0.8rem; color:#888; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:0.5rem;">Nota Média (0-10)</span>
                <span style="font-size:3.5rem; font-weight:800; color:#333; line-height:1;">${averageScore}</span>
                <div style="margin-top:1rem; width:100%; background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${averageScore * 10}%; background:var(--primary); height:100%;"></div>
                </div>
                <span style="display:block; font-size:0.8rem; color:#999; margin-top:10px;">Baseado em ${total} votos</span>
            </div>

            <!-- 3. RESUMO RÁPIDO -->
            <div style="background:var(--primary-light); padding:1.5rem; border-radius:16px; border:1px solid rgba(255, 64, 129, 0.1); display:flex; flex-direction:column; justify-content:center;">
                <h4 style="color:var(--primary); margin-bottom:0.5rem;">Análise Rápida</h4>
                <p style="font-size:0.9rem; color:#555; line-height:1.5;">
                    ${getAnalysisText(npsScore, total)}
                </p>
            </div>
        </div>

        <!-- LISTA DE COMENTÁRIOS -->
        <div style="background:white; padding:1.5rem; border-radius:16px; border:1px solid #eee;">
            <h3 style="margin-bottom:1.5rem; font-size:1.1rem; padding-bottom:1rem; border-bottom:1px solid #eee;">Feedbacks Recebidos</h3>
            <div style="max-height:400px; overflow-y:auto;">
                ${renderComments(feedbacks)}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // --- FUNÇÕES ---

    window.switchFeedEvent = (id) => { currentEventId = id; renderFeedback(container); };

    window.openSurveyLink = () => {
        const event = events.find(e => e.id == currentEventId);
        const topic = event ? event.topic : 'Evento';
        
        // CÓDIGO DA PÁGINA PÚBLICA (Mantido igual, mas garantindo parseInt no salvamento)
        const html = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Avaliação - ${topic}</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4f6f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                .card { background: white; width: 100%; max-width: 500px; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; }
                .scale { display: flex; gap: 5px; justify-content: center; margin: 2rem 0; flex-wrap: wrap; }
                .score-btn { width: 38px; height: 38px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-weight: 700; color: #555; transition: 0.2s; }
                .score-btn:hover, .score-btn.selected { background: #FF4081; color: white; border-color: #FF4081; transform: scale(1.1); }
                textarea { width: 100%; padding: 1rem; border: 1px solid #eee; border-radius: 12px; margin-bottom: 1.5rem; resize: vertical; box-sizing: border-box; font-family: inherit; }
                .btn-submit { background: #333; color: white; border: none; padding: 1rem 2rem; border-radius: 50px; font-weight: 700; cursor: pointer; width: 100%; }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <div id="survey" class="card">
                <h1 style="font-size:1.5rem; color:#333;">${topic}</h1>
                <p style="color:#666;">De 0 a 10, qual nota você dá para este evento?</p>
                <div class="scale">
                    ${[0,1,2,3,4,5,6,7,8,9,10].map(n => `<button class="score-btn" onclick="selectScore(${n}, this)">${n}</button>`).join('')}
                </div>
                <textarea id="comment" rows="3" placeholder="Comentário opcional..."></textarea>
                <button onclick="submitVote()" class="btn-submit">ENVIAR</button>
            </div>
            <div id="success" class="card hidden">
                <h2 style="color:#4CAF50;">Recebido!</h2>
                <p>Obrigado pelo seu feedback.</p>
                <button onclick="window.close()" style="margin-top:2rem; background:transparent; border:none; color:#999; cursor:pointer;">Fechar</button>
            </div>
            <script>
                let selectedScore = null;
                const eventId = ${event.id};
                function selectScore(n, btn) {
                    selectedScore = n;
                    document.querySelectorAll('.score-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                }
                function submitVote() {
                    if (selectedScore === null) return alert("Selecione uma nota.");
                    const comment = document.getElementById('comment').value;
                    try {
                        let feedbacks = JSON.parse(localStorage.getItem('hacka_feedbacks')) || [];
                        feedbacks.unshift({
                            id: 'feed_' + Date.now(),
                            eventId: eventId,
                            score: parseInt(selectedScore), // Garante Número Inteiro
                            comment: comment,
                            date: new Date().toISOString()
                        });
                        localStorage.setItem('hacka_feedbacks', JSON.stringify(feedbacks));
                        document.getElementById('survey').classList.add('hidden');
                        document.getElementById('success').classList.remove('hidden');
                        if(window.opener) window.opener.location.reload();
                    } catch(e) { alert("Erro ao salvar."); }
                }
            </script>
        </body>
        </html>
        `;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        window.open(URL.createObjectURL(blob), '_blank');
    };
}

function renderComments(list) {
    if (list.length === 0) return '<p style="color:#999; text-align:center;">Nenhum feedback.</p>';

    return list.map(f => {
        let color = '#aaa';
        let icon = 'sentiment_neutral';
        
        if (f.score >= 9) { color = '#2E7D32'; icon = 'sentiment_very_satisfied'; }
        else if (f.score <= 6) { color = '#F44336'; icon = 'sentiment_very_dissatisfied'; }

        return `
            <div style="border-bottom:1px solid #f0f0f0; padding:1rem 0; display:flex; gap:1rem;">
                <div style="background:${color}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:700;">
                    ${f.score}
                </div>
                <div style="flex:1;">
                    <p style="color:#333; font-size:0.95rem; margin:0 0 0.3rem 0; font-style:${f.comment ? 'normal' : 'italic'};">
                        ${f.comment || 'Sem comentário por escrito.'}
                    </p>
                    <small style="color:#999;">${new Date(f.date).toLocaleDateString()} às ${new Date(f.date).toLocaleTimeString()}</small>
                </div>
            </div>
        `;
    }).join('');
}

function getAnalysisText(nps, total) {
    if (total === 0) return "Aguardando as primeiras respostas para gerar análise.";
    
    if (nps >= 75) return "Parabéns! Seu evento está na zona de excelência. A maioria dos participantes são promotores da sua marca.";
    if (nps >= 50) return "Muito bom. Você tem mais promotores do que detratores, mas há espaço para encantar os clientes passivos.";
    if (nps >= 0) return "Atenção. O saldo é positivo, mas a quantidade de passivos ou detratores está segurando seu crescimento.";
    return "Crítico. Há muitos detratores. Revise urgentemente os pontos negativos citados nos comentários.";
}