// js/modules/ai.js

export async function generateEventStrategy(eventData) {
    // Limpa cache antigo pra não dar conflito
    localStorage.removeItem('hacka_best_model');

    const apiKey = localStorage.getItem('hacka_api_key');
    if (!apiKey) {
        alert("⚠️ Sem API Key! Configure na engrenagem ⚙️.");
        return { error: "Chave não configurada." };
    }

    try {
        // 1. DESCOBRIR O NOME EXATO DO MODELO DISPONÍVEL
        const modelName = await findWorkingModel(apiKey);
        console.log(`🎯 Modelo escolhido: ${modelName}`);

        if (!modelName) {
            return { error: "Sua chave não tem acesso aos modelos Flash ou Pro. Verifique sua conta Google AI Studio." };
        }

        // 2. MONTAR PROMPT
        const promptText = buildPrompt(eventData);

        // 3. EXECUTAR
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        // 4. TRATAR ERROS
        if (data.error) {
            console.error("Erro API:", data.error);
            if (data.error.message.includes("Quota")) {
                return { error: "⏳ Cota excedida. Aguarde 30s e tente de novo." };
            }
            return { error: `Erro Google (${modelName}): ${data.error.message}` };
        }

        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        rawText = rawText.replace(/```html/g, '').replace(/```/g, '').trim();

        return { success: true, text: rawText };

    } catch (e) {
        console.error(e);
        return { error: "Erro de conexão." };
    }
}

// --- A MÁGICA DE DETECÇÃO ---
async function findWorkingModel(apiKey) {
    try {
        // Pede a lista completa
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("Erro ao listar modelos:", data.error);
            return null; // Chave inválida provavelmente
        }

        // Mapeia apenas os nomes (ex: "models/gemini-1.5-flash-001")
        const models = data.models.map(m => m.name.replace('models/', ''));
        console.log("📜 Modelos disponíveis na sua conta:", models);

        // ORDEM DE PREFERÊNCIA (Do melhor/mais barato para o pior)
        // Procuramos por nomes exatos que costumam funcionar
        const priorityList = [
            'gemini-1.5-flash',          // Genérico ideal
            'gemini-1.5-flash-latest',   // Versão latest
            'gemini-1.5-flash-001',      // Versão específica (MUITO COMUM)
            'gemini-1.5-flash-8b',       // Versão leve
            'gemini-1.0-pro',            // Fallback antigo
            'gemini-pro'                 // Fallback clássico
        ];

        // 1. Tenta achar um da lista de prioridade
        for (let prefered of priorityList) {
            if (models.includes(prefered)) return prefered;
        }

        // 2. Se não achou exato, tenta qualquer um que tenha "flash" no nome
        const anyFlash = models.find(m => m.includes('flash') && !m.includes('8b')); // 8b as vezes é instável
        if (anyFlash) return anyFlash;

        // 3. Se não tem flash, tenta qualquer "pro" (cuidado com cota)
        const anyPro = models.find(m => m.includes('pro') && !m.includes('vision')); 
        if (anyPro) return anyPro;

        return models[0]; // Retorna o primeiro que achar (desespero)

    } catch (error) {
        console.error("Falha na detecção automática", error);
        return 'gemini-1.5-flash-latest'; // Chute final se a listagem falhar
    }
}

function buildPrompt(data) {
    return `
    Atue como Organizador de Eventos Sênior. Crie um Planejamento Tático Operacional para:
    EVENTO: ${data.type} | TEMA: ${data.objective}
    PÚBLICO: ${data.target} | ORÇAMENTO: ${data.budget}
    DATA: ${data.date} | FORMATO: ${data.format}

    IMPORTANTE: Responda APENAS HTML limpo dentro de divs com classes. NÃO use Markdown.
    
    Estrutura Obrigatória de Resposta:
    
    <div class="strategy-card pre-event">
        <div class="card-header"><h3>⚡ Pré-Evento (Planejamento)</h3></div>
        <div class="card-content">
            <p><strong>Foco:</strong> Aquecimento e Vendas</p>
            <ul>
                <li>[Ação Prática com Prazo]</li>
                <li>[Ação de Marketing]</li>
                <li>[Contratação Logística]</li>
                <li>[Checklist de Materiais]</li>
            </ul>
        </div>
    </div>

    <div class="strategy-card during-event">
        <div class="card-header"><h3>🔥 Durante (Execução)</h3></div>
        <div class="card-content">
            <p><strong>Foco:</strong> Experiência "Uau": ${data.wow}</p>
            <ul>
                <li>[Cronograma Macro: Manhã]</li>
                <li>[Cronograma Macro: Tarde]</li>
                <li>[Dinâmica de Engajamento]</li>
                <li>[Gestão de Imprevistos]</li>
            </ul>
        </div>
    </div>

    <div class="strategy-card post-event">
        <div class="card-header"><h3>🚀 Pós-Evento (Legado)</h3></div>
        <div class="card-content">
            <p><strong>Foco:</strong> Retenção e Dados</p>
            <ul>
                <li>[Ação de Follow-up]</li>
                <li>[Pesquisa NPS]</li>
                <li>[Análise de Métricas]</li>
            </ul>
        </div>
    </div>
    `;
}