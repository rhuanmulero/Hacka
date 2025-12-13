// js/modules/checkin.js
import { getEvents, getParticipants, updateParticipant } from '../core/state.js';

let currentEventId = null;

export function renderCheckin(container) {
    const events = getEvents();

    if (events.length === 0) {
        container.innerHTML = `<div class="empty-state">Crie um evento para acessar a portaria.</div>`;
        return;
    }

    if (!currentEventId || !events.find(e => e.id == currentEventId)) {
        currentEventId = events[0].id;
    }

    const allParts = getParticipants(currentEventId);
    const checkedIn = allParts.filter(p => p.status === 'Check-in').length;
    const pending = allParts.length - checkedIn;

    const html = `
        <div style="max-width: 800px; margin: 0 auto; padding-top: 2rem;">
            
            <!-- HEADER -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="font-size: 2.2rem; color: var(--primary);">Portaria Digital</h1>
                <div style="display:inline-block; background:#fff; padding:0.5rem 1.5rem; border-radius:50px; border:1px solid #eee; margin-top:1rem;">
                    <select style="border:none; font-weight:700; font-size:1.1rem; color:var(--text-main); outline:none; background:transparent; cursor:pointer;" onchange="window.switchCheckinEvent(this.value)">
                        ${events.map(e => `<option value="${e.id}" ${e.id == currentEventId ? 'selected' : ''}>${e.topic || e.type}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- PLACAR -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-card" style="text-align:center; padding:1.5rem; display:block;">
                    <span style="font-size:2rem; font-weight:800; display:block;">${allParts.length}</span>
                    <span style="color:#888; font-size:0.8rem;">Total</span>
                </div>
                <div class="stat-card" style="text-align:center; padding:1.5rem; display:block; border-bottom:4px solid var(--primary);">
                    <span style="font-size:2rem; font-weight:800; display:block; color:var(--primary);">${checkedIn}</span>
                    <span style="color:#888; font-size:0.8rem;">Presentes</span>
                </div>
                <div class="stat-card" style="text-align:center; padding:1.5rem; display:block;">
                    <span style="font-size:2rem; font-weight:800; display:block; color:#aaa;">${pending}</span>
                    <span style="color:#888; font-size:0.8rem;">Fila</span>
                </div>
            </div>

            <!-- CONTAINER PRINCIPAL BRANCO -->
            <div style="background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); text-align: center; min-height: 300px; display:flex; flex-direction:column; justify-content:center;">
                
                <!-- ÁREA DE BUSCA (ID para esconder depois) -->
                <div id="search-container">
                    <label style="display:block; font-weight:700; color:#555; margin-bottom:1rem; font-size:1.1rem;">
                        Digite Nome ou E-mail
                    </label>
                    
                    <div style="position:relative; max-width:500px; margin:0 auto;">
                        <input type="text" id="checkin-input" 
                            placeholder="Buscar participante..." 
                            style="width:100%; padding:1rem 1rem 1rem 3rem; font-size:1.2rem; border:2px solid #eee; border-radius:12px; outline:none; transition:0.3s;"
                            onkeyup="window.handleCheckinSearch(this.value)"
                            autocomplete="off" autofocus>
                        <span class="material-icons-round" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#aaa;">search</span>
                    </div>

                    <!-- LISTA DE RESULTADOS -->
                    <div id="checkin-results" style="margin-top: 2rem; text-align: left;">
                        <p style="text-align:center; color:#999; margin-top:1rem;">Aguardando digitação...</p>
                    </div>
                </div>

                <!-- ÁREA DE SUCESSO (Invisível por padrão) -->
                <div id="success-container" style="display:none; animation: fadeIn 0.3s ease;">
                    <!-- O JS vai injetar o conteúdo aqui -->
                </div>

            </div>

            <div style="margin-top: 3rem;">
                <h4 style="color:#888; margin-bottom:1rem; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px;">Histórico Recente</h4>
                <div id="checkin-log">
                    ${renderRecentLog(allParts)}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    
    setTimeout(() => { document.getElementById('checkin-input')?.focus(); }, 200);

    // --- FUNÇÕES ---

    window.switchCheckinEvent = (id) => { currentEventId = id; renderCheckin(container); };

    window.handleCheckinSearch = (val) => {
        const resultsDiv = document.getElementById('checkin-results');
        if (val.length < 2) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999; margin-top:1rem;">Digite para buscar...</p>';
            return;
        }
        const matches = getParticipants(currentEventId).filter(p => 
            p.name.toLowerCase().includes(val.toLowerCase()) || 
            p.email.toLowerCase().includes(val.toLowerCase())
        );

        if (matches.length === 0) {
            resultsDiv.innerHTML = `<div style="text-align:center; padding:1rem; color:#ef6c00;">Nenhum participante encontrado.</div>`;
            return;
        }

        resultsDiv.innerHTML = matches.map(p => {
            const isChecked = p.status === 'Check-in';
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid #eee; background:${isChecked ? '#f9f9f9' : '#fff'};">
                <div style="display:flex; gap:1rem; align-items:center; opacity:${isChecked ? 0.5 : 1}">
                    <div class="avatar-small" style="background:${isChecked ? '#ccc' : 'var(--primary)'}; color:#fff;">${p.name.charAt(0)}</div>
                    <div><h4 style="margin:0;">${p.name}</h4><span style="font-size:0.8rem; color:#666;">${p.role}</span></div>
                </div>
                ${isChecked ? `<span style="background:#eee; color:#555; padding:0.4rem 0.8rem; border-radius:50px; font-size:0.75rem;">ENTROU</span>` 
                           : `<button onclick="window.confirmCheckin('${p.id}')" class="btn-create" style="padding:0.5rem 1.2rem; min-width:auto;">LIBERAR</button>`}
            </div>`;
        }).join('');
    };

    window.confirmCheckin = (id) => {
        updateParticipant(id, { status: 'Check-in', checkinTime: new Date().toISOString() });
        const p = getParticipants(currentEventId).find(part => part.id === id);

        // ESCONDE A BUSCA, MOSTRA O SUCESSO
        document.getElementById('search-container').style.display = 'none';
        const successDiv = document.getElementById('success-container');
        successDiv.style.display = 'block';
        
        successDiv.innerHTML = `
            <div style="text-align:center; padding:1rem;">
                <div style="background:#e8f5e9; width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem;">
                    <span class="material-icons-round" style="font-size:3rem; color:#2e7d32;">check</span>
                </div>
                <h2 style="color:#2e7d32; margin-bottom:0.5rem;">${p.name} liberado!</h2>
                <p style="color:#555; margin-bottom:2rem;">Entrada registrada às ${new Date().toLocaleTimeString()}.</p>
                
                <div style="display:flex; justify-content:center; gap:1rem;">
                    <button onclick="window.printBadge('${p.name}', '${p.role}', '${p.id}')" class="btn-create" style="background:#333;">
                        <span class="material-icons-round" style="margin-right:8px;">print</span> Imprimir
                    </button>
                    <button onclick="window.resetCheckin()" class="btn-text" style="background:#fff; border:1px solid #ccc; padding:0.8rem 1.5rem;">
                        Próximo <span class="material-icons-round">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
    };

    window.resetCheckin = () => {
        // Reseta tudo recarregando o componente
        renderCheckin(container);
    };

    // GERADOR DE CRACHÁ (PDF)
    window.printBadge = (name, role, id) => {
        const events = getEvents();
        const event = events.find(e => e.id == currentEventId);
        const topic = event ? (event.topic || 'Evento') : 'Evento';

        const html = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Crachá - ${name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { margin:0; padding:0; background:#eee; font-family: 'Inter', sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; }
                
                .badge {
                    width: 320px; height: 480px; /* Tamanho A6 aprox */
                    background: white;
                    border: 1px solid #ccc;
                    position: relative;
                    text-align: center;
                    display: flex; flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                
                .header { background: #000; color: white; padding: 30px 20px; flex-shrink: 0; }
                .event-name { font-weight: 900; text-transform: uppercase; letter-spacing: 2px; font-size: 1.1rem; line-height: 1.2; }
                
                .body { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 20px; }
                .name { font-size: 2.2rem; font-weight: 800; line-height: 1.1; margin-bottom: 15px; color:#000; word-wrap: break-word; }
                .role { 
                    font-size: 1.1rem; font-weight: 700; color: #fff; text-transform: uppercase; 
                    background: #000; display: inline-block; padding: 8px 20px; border-radius: 4px; 
                }
                
                .footer { padding: 20px; border-top: 2px dashed #eee; flex-shrink: 0; }
                .qr-placeholder { 
                    width: 80px; height: 80px; background: #000; margin: 0 auto; 
                    display:flex; align-items:center; justify-content:center; 
                    color:white; font-size:0.7rem; font-weight:bold;
                }
                
                @media print {
                    body { background: none; height: auto; display: block; }
                    .badge { 
                        box-shadow: none; border: 1px solid #000; 
                        margin: 0 auto; page-break-after: always; 
                    }
                    button { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="badge">
                <div class="header">
                    <div class="event-name">${topic}</div>
                </div>
                <div class="body">
                    <div class="name">${name}</div>
                    <div><span class="role">${role}</span></div>
                </div>
                <div class="footer">
                    <div class="qr-placeholder">QR CODE</div>
                    <p style="font-size:0.7rem; color:#555; margin-top:10px; font-family:monospace;">ID: ${id}</p>
                </div>
            </div>
            
            <button onclick="window.print()" style="
                position:fixed; bottom:30px; right:30px; 
                padding:15px 30px; background:#000; color:white; 
                border:none; cursor:pointer; font-weight:bold; border-radius:8px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                IMPRIMIR
            </button>
        </body>
        </html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };
}

function renderRecentLog(allParts) {
    const recent = allParts
        .filter(p => p.status === 'Check-in' && p.checkinTime)
        .sort((a, b) => new Date(b.checkinTime) - new Date(a.checkinTime))
        .slice(0, 5);

    if (recent.length === 0) return '<p style="color:#ccc; font-style:italic;">Nenhum acesso registrado ainda.</p>';

    return recent.map(p => `
        <div style="display:flex; justify-content:space-between; padding:0.8rem 0; border-bottom:1px solid #f0f0f0;">
            <span style="font-weight:600; color:#333;">${p.name}</span>
            <span style="color:#888; font-family:monospace;">${new Date(p.checkinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `).join('');
}