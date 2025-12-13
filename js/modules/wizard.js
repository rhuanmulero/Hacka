// js/modules/wizard.js
import { navigateTo } from '../core/router.js';
import { saveEvent } from '../core/state.js';
import { generateEventStrategy } from './ai.js';
import { autoCreateTasksFromStrategy } from '../core/state.js';

let currentStep = 1;
const totalSteps = 5;
let formData = {};

// Configuração dos Passos e Perguntas (Fica fácil editar aqui)
const stepsConfig = [
    {
        id: 1, title: "Definição Estratégica", subtitle: "O alicerce do evento (Por que e Quem).",
        questions: [
            { key: 'type', label: 'Formato do Evento', type: 'cards', options: [
                { val: 'Hackathon', icon: 'code', label: 'Hackathon' },
                { val: 'Workshop', icon: 'school', label: 'Workshop' },
                { val: 'Conferência', icon: 'mic', label: 'Conferência' },
                { val: 'Meetup', icon: 'groups', label: 'Meetup' },
                { val: 'Outro', icon: 'edit', label: 'Outro' }
            ]},
            { key: 'objective', label: 'Objetivo Principal', type: 'cards', options: [
                { val: 'Leads', icon: 'filter_alt', label: 'Gerar Leads' },
                { val: 'Autoridade', icon: 'verified', label: 'Marca/Autoridade' },
                { val: 'Educação', icon: 'menu_book', label: 'Educar Mercado' },
                { val: 'Vendas', icon: 'payments', label: 'Vendas Diretas' },
                { val: 'Outro', icon: 'add', label: 'Outro' }
            ]}
        ]
    },
    {
        id: 2, title: "Financeiro", subtitle: "A viabilidade do projeto (Quanto).",
        questions: [
            { key: 'budget', label: 'Qual o Orçamento?', type: 'cards', options: [
                { val: 'Baixo Custo', icon: 'savings', label: 'Baixo Custo' },
                { val: 'Médio', icon: 'attach_money', label: 'Médio Porte' },
                { val: 'Alto', icon: 'currency_exchange', label: 'Alto Investimento' },
                { val: 'Ilimitado', icon: 'all_inclusive', label: 'Sem Teto' }
            ]},
            { key: 'funding', label: 'Fonte de Recurso', type: 'cards', options: [
                { val: 'Empresa', icon: 'apartment', label: 'Verba Interna' },
                { val: 'Patrocínio', icon: 'handshake', label: 'Patrocínios' },
                { val: 'Ingressos', icon: 'confirmation_number', label: 'Ingressos' },
                { val: 'Misto', icon: 'pie_chart', label: 'Misto' }
            ]}
        ]
    },
    {
        id: 3, title: "Logística & Público", subtitle: "Quem vem e onde será.",
        questions: [
            { key: 'target', label: 'Perfil do Público', type: 'cards', options: [ // MUDOU PARA CARDS
                { val: 'Programadores', icon: 'terminal', label: 'Devs/TI' },
                { val: 'Executivos', icon: 'business_center', label: 'Executivos' },
                { val: 'Estudantes', icon: 'backpack', label: 'Estudantes' },
                { val: 'Startups', icon: 'rocket_launch', label: 'Startups' },
                { val: 'Outro', icon: 'person_add', label: 'Outro' }
            ]},
            { key: 'format', label: 'Modelo', type: 'cards', options: [
                { val: 'Presencial', icon: 'place', label: 'Presencial' },
                { val: 'Online', icon: 'public', label: '100% Online' },
                { val: 'Híbrido', icon: 'router', label: 'Híbrido' }
            ]},
            { key: 'date', label: 'Data Prevista', type: 'date' }
        ]
    },
    {
        id: 4, title: "Marketing & Experiência", subtitle: "Como atrair e encantar.",
        questions: [
            { key: 'channels', label: 'Canal Principal', type: 'cards', options: [
                { val: 'LinkedIn', icon: 'work', label: 'LinkedIn' },
                { val: 'Instagram', icon: 'photo_camera', label: 'Instagram' },
                { val: 'Email', icon: 'mail', label: 'Email Mkt' },
                { val: 'Ads', icon: 'campaign', label: 'Tráfego Pago' },
                { val: 'Outro', icon: 'add_link', label: 'Outro' }
            ]},
            { key: 'usp', label: 'Promessa Única (Diferencial)', type: 'text', placeholder: 'Ex: Conexão direta com investidores...' },
            { key: 'wow', label: 'Fator Uau (Opcional)', type: 'text', placeholder: 'Ex: Show de encerramento, Brinde exclusivo...' }
        ]
    },
    { id: 5, title: "Gerar Planejamento", subtitle: "A IA vai estruturar tudo agora.", type: 'final' }
];

export function renderWizard(container) {
    currentStep = 1;
    formData = {}; 
    renderStep(container);
}

function renderStep(container) {
    const stepData = stepsConfig[currentStep - 1];
    
    // Header Padrão
    let html = `
        <div class="wizard-header">
            <button onclick="window.navTo('dashboard')" class="btn-back">
                <span class="material-icons-round">close</span> Fechar
            </button>
            <div class="progress-wrapper">
                <span>Passo <b>${currentStep}</b> de ${totalSteps}</span>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${(currentStep/totalSteps)*100}%"></div>
                </div>
            </div>
        </div>
        
        <div class="wizard-content animate-fade">
            <div class="step-header">
                <h2 class="step-title">${stepData.title}</h2>
                <p class="step-subtitle">${stepData.subtitle}</p>
            </div>
    `;

    // Renderiza Perguntas Dinamicamente
    if (stepData.type !== 'final') {
        stepData.questions.forEach(q => {
            html += `<div class="question-block" style="margin-bottom: 2.5rem;">`;
            html += `<label style="display:block; margin-bottom:1rem; font-weight:700; color:#333;">${q.label}</label>`;

            if (q.type === 'cards') {
                html += `<div class="selection-grid">`;
                q.options.forEach(opt => {
                    // Verifica se já estava selecionado antes (para voltar passo)
                    const isSelected = formData[q.key] === opt.val ? 'selected' : '';
                    html += `
                        <div class="selection-card ${isSelected}" onclick="selectCard('${q.key}', '${opt.val}', this)">
                            <span class="material-icons-round">${opt.icon}</span>
                            <h3>${opt.label}</h3>
                        </div>
                    `;
                });
                html += `</div>`;
                
                // Área para "Outro" input
                const showInput = formData[q.key] === 'Outro' ? '' : 'display:none';
                html += `
                    <div id="input-${q.key}" class="conditional-input" style="${showInput}">
                        <input type="text" id="text-${q.key}" class="big-input" placeholder="Especifique..." onchange="saveText('${q.key}')" value="${formData[q.key+'_custom'] || ''}">
                    </div>
                `;

            } else if (q.type === 'text') {
                html += `<input type="text" class="big-input" placeholder="${q.placeholder}" onchange="saveDirectInput('${q.key}', this.value)" value="${formData[q.key] || ''}">`;
            } else if (q.type === 'date') {
                html += `<input type="date" class="big-input" onchange="saveDirectInput('${q.key}', this.value)" value="${formData[q.key] || ''}">`;
            }
            html += `</div>`;
        });
    } else {
        // TELA FINAL (LOADING/RESULT)
        html += `
            <div id="ai-loading" style="text-align:center; padding: 2rem;">
                <div class="spinner" style="width:60px; height:60px;"></div>
                <h3 style="margin-top:1rem;">Conectando ao Google Gemini...</h3>
                <p>Criando cronograma e estratégia personalizada.</p>
            </div>
            <div id="ai-result" class="hidden">
                <div class="success-box" style="text-align:left;">
                    <h3 style="color:#2ecc71; display:flex; align-items:center; gap:0.5rem;">
                        <span class="material-icons-round">check_circle</span> Estratégia Pronta!
                    </h3>
                    <div id="ai-content" class="ai-text-box"></div>
                </div>
            </div>
        `;
    }

    html += `</div>`; // fecha content

    // Footer
    html += `
        <div class="wizard-footer">
            <div style="display:flex; justify-content: space-between;">
                <button class="btn-text" onclick="changeWizardStep(-1)" ${currentStep===1 ? 'disabled' : ''}>Voltar</button>
                <button id="btn-next" class="btn-create" onclick="changeWizardStep(1)">
                    ${currentStep === totalSteps ? 'Finalizar' : 'Continuar'}
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Se for o último passo, dispara a IA automaticamente
    if (currentStep === totalSteps) {
        document.getElementById('btn-next').style.display = 'none'; // Esconde botão até terminar
        executeAI();
    }
}

// LÓGICA DE SELEÇÃO E NAVEGAÇÃO
window.selectCard = (key, value, cardElement) => {
    // 1. Remove seleção visual dos irmãos
    const parent = cardElement.parentElement;
    Array.from(parent.children).forEach(child => child.classList.remove('selected'));
    
    // 2. Seleciona o atual
    cardElement.classList.add('selected');
    
    // 3. Salva no formData
    formData[key] = value;

    // 4. Lógica do "Outro"
    const inputDiv = document.getElementById(`input-${key}`);
    if (inputDiv) {
        if (value === 'Outro') {
            inputDiv.style.display = 'block';
            document.getElementById(`text-${key}`).focus();
        } else {
            inputDiv.style.display = 'none';
            delete formData[key+'_custom']; // Limpa se mudou de ideia
        }
    }
};

window.saveText = (key) => {
    const val = document.getElementById(`text-${key}`).value;
    formData[key+'_custom'] = val; // Salva o texto customizado separadamente
};

window.saveDirectInput = (key, value) => {
    formData[key] = value;
};

window.changeWizardStep = (dir) => {
    const next = currentStep + dir;
    
    // Validação básica (Opcional: impedir avançar se formData[key] estiver vazio)
    // if (dir === 1 && !validateCurrentStep()) return; 

    if (next > 0 && next <= totalSteps) {
        currentStep = next;
        const container = document.getElementById('app-root');
        renderStep(container);
    } else if (next > totalSteps) {
        // Finalizou na tela de resultado
        saveAndExit();
    }
};

async function executeAI() {
    // Prepara dados finais (se tiver custom, usa o custom)
    const finalData = { ...formData };
    // Normaliza campos "Outro"
    Object.keys(finalData).forEach(k => {
        if (finalData[k] === 'Outro' && finalData[k+'_custom']) {
            finalData[k] = finalData[k+'_custom'];
        }
    });

    // CHAMA A IA REAL
    const result = await generateEventStrategy(finalData);

    const loading = document.getElementById('ai-loading');
    const resultDiv = document.getElementById('ai-result');
    const content = document.getElementById('ai-content');
    const btnNext = document.getElementById('btn-next');

    loading.style.display = 'none';

    if (result.error) {
        resultDiv.classList.remove('hidden');
        content.innerHTML = `<p style="color:red; font-weight:bold;">${result.error}</p>`;
        btnNext.innerText = "Tentar Novamente";
        btnNext.style.display = 'block';
        btnNext.onclick = () => window.location.reload(); // Reset brutal pra limpar chave errada se for o caso
    } else {
        resultDiv.classList.remove('hidden');
        content.innerHTML = result.text;
        
        // Salva estratégia no formData para persistir
        formData.strategyHTML = result.text;
        
        btnNext.innerText = "Salvar e Ir para Agenda";
        btnNext.style.display = 'block';
    }
}

function saveAndExit() {
    // Título inteligente
    const title = formData.topic ? formData.topic : `${formData.type} - ${formData.objective}`;
    const newEventId = Date.now(); // Gera ID único
    
    // 1. Salva o Evento
    saveEvent({
        id: newEventId, // Força o ID gerado
        topic: title,
        type: formData.type,
        audience: formData.target || 'Geral',
        date: formData.date || new Date().toISOString(),
        fullStrategy: formData.strategyHTML || '<p>Erro: Estratégia não salva.</p>',
        raw: formData
    });

    // 2. MÁGICA: Converte a Estratégia em Tasks do Kanban
    // (Certifique-se de ter importado autoCreateTasksFromStrategy no topo do arquivo)
    if (formData.strategyHTML) {
        autoCreateTasksFromStrategy(newEventId, formData.strategyHTML);
    }
    
    // 3. Redireciona para o Kanban
    window.navTo('tasks'); 
}

