// js/modules/certificates.js
import { getEvents, getParticipants } from '../core/state.js';

let currentEventId = null;

export function renderCertificates(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para emitir certificados.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    // Apenas quem fez Check-in merece certificado!
    const participants = getParticipants(currentEventId).filter(p => p.status === 'Check-in');

    const html = `
        <header class="top-header" style="margin-bottom: 2rem;">
            <div>
                <h1>Certificados</h1>
                <p class="subtitle">Emissão para participantes presentes.</p>
            </div>
        </header>

        <div class="filter-bar">
            <div style="display:flex; flex-direction:column; justify-content:center;">
                <label style="font-size:0.65rem; font-weight:700; color:#aaa; letter-spacing:1px; margin-bottom:2px;">EVENTO:</label>
                <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchCertEvent(this.value)">
                    ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                </select>
            </div>
            
            <div style="margin-left:auto; display:flex; align-items:center; gap:10px;">
                <span class="material-icons-round" style="color:#4CAF50;">verified</span>
                <span style="font-weight:700;">${participants.length}</span> elegíveis
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Participante</th>
                        <th>Status</th>
                        <th>Data Check-in</th>
                        <th style="text-align:right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderRows(participants)}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    window.switchCertEvent = (id) => {
        currentEventId = id;
        renderCertificates(container);
    };

    window.generateCertificate = (pId, pName) => {
        const event = events.find(e => e.id == currentEventId);
        openCertificateWindow(event, pName);
    };
}

function renderRows(list) {
    if (list.length === 0) return `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#999">Nenhum participante realizou check-in ainda.</td></tr>`;

    return list.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small style="color:#888">${p.email}</small></td>
            <td><span class="badge-status" style="background:#e8f5e9; color:#2e7d32">Presente</span></td>
            <td>${p.checkinTime ? new Date(p.checkinTime).toLocaleDateString() : '-'}</td>
            <td style="text-align:right">
                <button onclick="window.generateCertificate('${p.id}', '${p.name}')" class="btn-create" style="padding:0.5rem 1rem; font-size:0.8rem;">
                    <span class="material-icons-round" style="font-size:1rem; margin-right:5px;">file_download</span> Emitir
                </button>
            </td>
        </tr>
    `).join('');
}

// --- GERADOR DE PDF (HTML) ---
function openCertificateWindow(event, userName) {
    const dateStr = new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const html = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8"> <!-- ESSA LINHA CORRIGE OS ACENTOS -->
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificado - ${userName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Pinyon+Script&family=Lato:wght@300;400&display=swap" rel="stylesheet">
        <style>
            body { margin:0; padding:0; background:#f0f0f0; display:flex; align-items:center; justify-content:center; height:100vh; font-family: 'Lato', sans-serif; }
            .cert-container {
                width: 900px; height: 600px; background: #fff; padding: 40px; text-align: center;
                border: 20px solid #fff; outline: 5px solid #d4af37;
                box-shadow: 0 0 50px rgba(0,0,0,0.1);
                position: relative;
                background-image: radial-gradient(#f9f9f9 20%, transparent 20%), radial-gradient(#f9f9f9 20%, transparent 20%);
                background-size: 20px 20px;
                background-position: 0 0, 10px 10px;
            }
            .corner { position: absolute; width: 80px; height: 80px; border-top: 5px solid #d4af37; border-left: 5px solid #d4af37; }
            .tr { top:20px; right:20px; transform: rotate(90deg); }
            .br { bottom:20px; right:20px; transform: rotate(180deg); }
            .bl { bottom:20px; left:20px; transform: rotate(270deg); }
            .tl { top:20px; left:20px; }

            h1 { font-family: 'Cinzel', serif; font-size: 3rem; color: #333; margin-top: 40px; text-transform: uppercase; letter-spacing: 5px; }
            .subtitle { font-size: 1.2rem; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: -10px; }
            
            .body-text { margin-top: 50px; font-size: 1.3rem; color: #555; line-height: 1.6; }
            .name { font-family: 'Pinyon Script', cursive; font-size: 4rem; color: #d4af37; display: block; margin: 10px 0; }
            
            .footer { margin-top: 60px; display: flex; justify-content: space-around; }
            .sign-line { border-top: 1px solid #333; width: 200px; padding-top: 10px; font-size: 0.9rem; font-weight: bold; }
            
            .logo { font-family: 'Cinzel'; font-weight: 700; font-size: 1.5rem; position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); opacity: 0.5; }
            
            @media print { body { background: none; } .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="cert-container">
            <div class="corner tl"></div><div class="corner tr"></div>
            <div class="corner br"></div><div class="corner bl"></div>

            <h1>Certificado</h1>
            <p class="subtitle">de Participação</p>

            <p class="body-text">
                Certificamos que
                <span class="name">${userName}</span>
                participou com êxito do evento <strong>${event.topic}</strong> (${event.type}),
                realizado em ${dateStr}, com carga horária de 8 horas.
            </p>

            <div class="footer">
                <div class="sign-line">Hacka.Eventos<br><small>Organização</small></div>
                <div class="sign-line">Rhuan M.<br><small>Diretor</small></div>
            </div>

            <div class="logo">HACKA.</div>
        </div>
        
        <div class="no-print" style="position:fixed; top:20px; right:20px;">
            <button onclick="window.print()" style="padding:15px 30px; background:#d4af37; color:white; border:none; font-size:1.2rem; cursor:pointer; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.2);">IMPRIMIR / PDF</button>
        </div>
    </body>
    </html>
    `;

    // Importante: especificar o charset no Blob também
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}