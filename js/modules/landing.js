// js/modules/landing.js
import { getTickets, getSessions } from '../core/state.js';

export function openLandingPage(eventData) {
    // 1. Busca Ingressos REAIS
    const tickets = getTickets(eventData.id);
    
    // 2. Busca Sessões REAIS (Agenda) - NOVO!
    const sessions = getSessions(eventData.id); 
    
    // 3. Define Visual
    const theme = getThemeConfig(eventData.type);
    
    // 4. Textos de Marketing
    const copy = generateMarketingCopy(eventData);

    // 5. Gera HTML (Passando sessions agora)
    const htmlContent = generateHTML(eventData, tickets, sessions, theme, copy);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

// --- CONFIGURAÇÃO DE TEMAS ---
function getThemeConfig(type) {
    const safeType = (type || '').toLowerCase();
    
    if (safeType.includes('hackathon') || safeType.includes('code') || safeType.includes('dev')) {
        return {
            id: 'tech', bg: '#050505', text: '#ffffff', primary: '#00F0FF', secondary: '#7000FF',
            fontHead: "'JetBrains Mono', monospace", fontBody: "'Inter', sans-serif",
            blobShape: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
            gradient: 'linear-gradient(90deg, #00F0FF, #7000FF)'
        };
    } else if (safeType.includes('executivo') || safeType.includes('business') || safeType.includes('conferência')) {
        return {
            id: 'biz', bg: '#0f172a', text: '#f8fafc', primary: '#38bdf8', secondary: '#f59e0b',
            fontHead: "'Plus Jakarta Sans', sans-serif", fontBody: "'Inter', sans-serif",
            blobShape: '50%',
            gradient: 'linear-gradient(90deg, #38bdf8, #0f172a)'
        };
    } else {
        return {
            id: 'creative', bg: '#18181b', text: '#ffffff', primary: '#ff4081', secondary: '#ff9100',
            fontHead: "'Plus Jakarta Sans', sans-serif", fontBody: "'Inter', sans-serif",
            blobShape: '30% 70% 70% 30% / 30% 30% 70% 70%',
            gradient: 'linear-gradient(90deg, #ff4081, #ff9100)'
        };
    }
}

function generateMarketingCopy(event) {
    return {
        headline: event.topic || 'Evento Inovador',
        subhead: `Uma imersão desenhada para ${event.audience}. Conecte-se e transforme sua carreira.`,
        cta: "GARANTIR VAGA"
    };
}

// --- GERADOR DE HTML INTELIGENTE ---
// Agora recebe "sessions" como parâmetro
function generateHTML(event, tickets, sessions, theme, copy) {
    const dateStr = new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // 1. LÓGICA DE INGRESSOS (Tickets)
    const ticketsHTML = tickets.length > 0 ? tickets.map(t => {
        const isFree = parseFloat(t.price) === 0;
        const priceDisplay = isFree ? 'GRÁTIS' : `R$ ${parseFloat(t.price).toFixed(2)}`;
        const soldOut = t.sold >= t.quantity;
        
        return `
        <div class="ticket-card ${soldOut ? 'disabled' : ''}" onclick="${soldOut ? '' : `selectTicket('${t.id}', '${t.name}', ${t.price})`}">
            <div class="ticket-header">
                <h3>${t.name}</h3>
                ${soldOut ? '<span class="badge-sold">ESGOTADO</span>' : ''}
            </div>
            <div class="ticket-price">${priceDisplay}</div>
            <ul class="ticket-features">
                <li>✅ Acesso completo</li>
                <li>✅ Certificado digital</li>
                <li>✅ Networking</li>
            </ul>
            <button class="btn-select">${soldOut ? 'Indisponível' : 'Selecionar'}</button>
        </div>
        `;
    }).join('') : '<p style="text-align:center; opacity:0.7;">Vendas não iniciadas.</p>';

    // 2. LÓGICA DA AGENDA (Sessions) - AQUI ESTÁ A MUDANÇA
    let agendaHTML = '';
    if (sessions && sessions.length > 0) {
        agendaHTML = sessions.map(item => `
            <div class="agenda-item">
                <div class="agenda-time">${item.time}</div>
                <div class="agenda-content">
                    <h4>${item.title}</h4>
                    <p>${item.desc || item.tag}</p>
                </div>
            </div>
        `).join('');
    } else {
        agendaHTML = `<div style="text-align:center; opacity:0.6; padding:1rem;">Programação em breve.</div>`;
    }

    // 3. SCRIPT INJETADO (Lógica de Compra)
    const scriptLogic = `
        <script>
            let selectedTicketId = null;
            let selectedPrice = 0;
            let eventId = ${event.id};

            function selectTicket(id, name, price) {
                selectedTicketId = id;
                selectedPrice = price;
                
                document.querySelectorAll('.ticket-card').forEach(el => el.classList.remove('active'));
                event.currentTarget.classList.add('active');
                
                document.getElementById('checkout-form').classList.remove('hidden');
                document.getElementById('checkout-form').scrollIntoView({behavior: "smooth"});
                
                document.getElementById('summary-ticket').innerText = name;
                document.getElementById('summary-total').innerText = price === 0 ? 'GRÁTIS' : 'R$ ' + price.toFixed(2);
            }

            function processPayment(e) {
                e.preventDefault();
                if(!selectedTicketId) return alert('Selecione um ingresso!');

                const name = document.getElementById('input-name').value;
                const email = document.getElementById('input-email').value;

                if(!name || !email) return alert('Preencha seus dados.');

                try {
                    // Atualizar Ingressos
                    let tickets = JSON.parse(localStorage.getItem('hacka_tickets')) || [];
                    const tIndex = tickets.findIndex(t => t.id === selectedTicketId);
                    if(tIndex > -1) {
                        if(tickets[tIndex].sold >= tickets[tIndex].quantity) {
                            alert('Ops! Esse ingresso acabou de esgotar.');
                            return;
                        }
                        tickets[tIndex].sold++;
                        localStorage.setItem('hacka_tickets', JSON.stringify(tickets));
                    }

                    // Criar Participante
                    let participants = JSON.parse(localStorage.getItem('hacka_participants')) || [];
                    participants.unshift({
                        id: 'p' + Date.now(),
                        eventId: eventId,
                        name: name,
                        email: email,
                        role: 'Participante',
                        status: 'Inscrito'
                    });
                    localStorage.setItem('hacka_participants', JSON.stringify(participants));

                    // Gerar Financeiro
                    if(selectedPrice > 0) {
                        let finance = JSON.parse(localStorage.getItem('hacka_finance')) || [];
                        finance.unshift({
                            id: 't' + Date.now(),
                            eventId: eventId,
                            description: 'Venda: ' + name,
                            amount: selectedPrice,
                            category: 'Ingressos',
                            type: 'income',
                            date: new Date().toISOString()
                        });
                        localStorage.setItem('hacka_finance', JSON.stringify(finance));
                    }

                    document.getElementById('checkout-area').innerHTML = \`
                        <div class="success-msg">
                            <h1>🎉 Sucesso!</h1>
                            <p>Sua inscrição foi confirmada.</p>
                            <button onclick="window.close()" class="btn-glow" style="margin-top:2rem">Voltar</button>
                        </div>
                    \`;
                    
                    if(window.opener) window.opener.location.reload();

                } catch(err) {
                    alert('Erro ao processar. Tente novamente.');
                }
            }
        </script>
    `;

    // 4. TEMPLATE HTML FINAL
    return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.topic} - Inscrição</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@700&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">

    <style>
        :root {
            --bg: ${theme.bg}; --text: ${theme.text};
            --primary: ${theme.primary}; --secondary: ${theme.secondary};
            --font-head: ${theme.fontHead}; --font-body: ${theme.fontBody};
            --gradient: ${theme.gradient};
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background: var(--bg); color: var(--text); font-family: var(--font-body); overflow-x: hidden; }

        .container { max-width: 1000px; margin: 0 auto; padding: 2rem; position: relative; z-index: 2; }
        
        .hero { text-align: center; padding: 4rem 0; }
        h1 { font-family: var(--font-head); font-size: 3.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { color: rgba(255,255,255,0.7); font-size: 1.2rem; margin-bottom: 2rem; }
        
        /* Estilos da Agenda */
        .agenda-grid { display: grid; gap: 1.5rem; max-width: 800px; margin: 0 auto; }
        .agenda-item {
            display: flex; align-items: flex-start; gap: 2rem;
            padding: 1.5rem; border-radius: 16px;
            background: rgba(255,255,255,0.02);
            border-left: 3px solid var(--primary);
        }
        .agenda-time { font-family: monospace; font-size: 1.1rem; color: var(--primary); min-width: 60px; font-weight:700; }
        .agenda-content h4 { font-size: 1.1rem; margin-bottom: 0.3rem; color:#fff; }
        .agenda-content p { font-size: 0.95rem; color: rgba(255,255,255,0.6); }

        /* Estilos dos Tickets */
        .tickets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 3rem 0; }
        .ticket-card {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; padding: 2rem; text-align: center; cursor: pointer; transition: 0.3s;
            position: relative; overflow: hidden;
        }
        .ticket-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        .ticket-card.active { border: 2px solid var(--primary); background: rgba(255,255,255,0.1); }
        .ticket-card.disabled { opacity: 0.5; pointer-events: none; filter: grayscale(1); }
        .ticket-price { font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 1rem 0; font-family: var(--font-head); }
        .ticket-features { list-style: none; text-align: left; margin-bottom: 2rem; opacity: 0.8; line-height: 1.6; }
        
        .btn-select {
            background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.8rem 1.5rem;
            border-radius: 50px; font-weight: 600; cursor: pointer; width: 100%; transition:0.2s;
        }
        .ticket-card:hover .btn-select { background: var(--primary); color: var(--bg); }
        .badge-sold { background: #ef5350; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold; }

        /* Form e Globais */
        .hidden { display: none; }
        .form-section { background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); max-width: 500px; margin: 0 auto; }
        input { width: 100%; padding: 1rem; margin-bottom: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 8px; }
        .btn-glow {
            background: var(--gradient); color: white; padding: 1rem 2rem; border-radius: 50px;
            font-weight: 800; border: none; cursor: pointer; width: 100%; font-size: 1.1rem;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        .success-msg { text-align: center; padding: 3rem; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from{opacity:0; transform:translateY(20px)} to{opacity:1; transform:translateY(0)} }
        .section-title { font-family: var(--font-head); font-size: 2rem; margin-bottom: 2rem; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <header class="hero">
            <span style="border:1px solid var(--primary); color:var(--primary); padding:0.3rem 0.8rem; border-radius:20px; font-size:0.8rem; letter-spacing:1px;">${event.type.toUpperCase()}</span>
            <h1>${copy.headline}</h1>
            <p class="subtitle">${copy.subhead}</p>
            <p style="opacity:0.6"><span class="material-icons-round" style="vertical-align:middle; font-size:1rem">event</span> ${dateStr}</p>
        </header>

        <!-- AQUI ENTRA A AGENDA DINÂMICA -->
        <section style="padding: 2rem 0;">
            <h2 class="section-title">Programação</h2>
            <div class="agenda-grid">
                ${agendaHTML}
            </div>
        </section>

        <section id="checkout-area">
            <h2 class="section-title">Inscrições</h2>
            <div class="tickets-grid">
                ${ticketsHTML}
            </div>

            <div id="checkout-form" class="hidden">
                <div class="form-section">
                    <h3 style="margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">Finalizar Inscrição</h3>
                    <div style="margin-bottom:1.5rem; font-size:0.9rem;">
                        <p>Ingresso: <strong id="summary-ticket">-</strong></p>
                        <p>Total: <strong id="summary-total" style="color:var(--primary); font-size:1.2rem">-</strong></p>
                    </div>
                    <form onsubmit="processPayment(event)">
                        <input type="text" id="input-name" placeholder="Nome Completo" required>
                        <input type="email" id="input-email" placeholder="E-mail" required>
                        <button type="submit" class="btn-glow">CONFIRMAR INSCRIÇÃO</button>
                    </form>
                </div>
            </div>
        <section>

        <footer style="text-align:center; padding:3rem 0; opacity:0.4; font-size:0.8rem;">
            Powered by Hacka.Eventos
        </footer>
    </div>
    ${scriptLogic}
</body>
</html>
    `;
}