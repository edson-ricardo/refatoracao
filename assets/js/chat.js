import { GoogleGenAI } from "https://esm.run/@google/genai";

// Leitura das variáveis do arquivo .env via Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";

// Inicializa o cliente oficial do Gemini com a chave de ambiente
const ai = new GoogleGenAI({ apiKey });

// Lista de páginas do site que a IA deve ler e mapear
const PAGES_TO_SCRAPE = [
  "index.html",
  "../templates/sobre.html",
  "../templates/contato.html",
  "../templates/projetos.html",
  "../templates/habilidades.html",
  "../templates/servicos.html",
  "../templates/depoimentos.html",
  "../templates/case-de-sucesso.html"
];

let cachedSiteData = "";

/**
 * Lê o HTML de todas as páginas listadas, remove tags desnecessárias
 * e limpa o texto para enviar como contexto à IA.
 */
async function fetchAllPagesContent() {
  if (cachedSiteData) return cachedSiteData;

  let combinedText = "";

  for (const page of PAGES_TO_SCRAPE) {
    try {
      // Usa caminho relativo direto para buscar o arquivo no Vite
      const response = await fetch(`./${page}`, { cache: "no-store" });
      
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        // Remove scripts, estilos, cabeçalhos/menus e o próprio widget do chat
        doc.querySelectorAll("script, style, header, nav, #chat-widget-container").forEach(el => el.remove());
        
        const pageCleanText = doc.body.textContent.replace(/\s+/g, ' ').trim();
        
        // Só adiciona se extraiu algum texto real da página
        if (pageCleanText.length > 0) {
          combinedText += `\n--- CONTEÚDO DA PÁGINA (${page}) ---\n${pageCleanText}\n`;
        }
      } else {
        console.warn(`Página não encontrada (${response.status}): ${page}`);
      }
    } catch (error) {
      console.warn(`Erro ao ler a página: ${page}`, error);
    }
  }

  cachedSiteData = combinedText;
  return combinedText;
}

/**
 * Envia a mensagem do usuário juntamente com o contexto raspado para a API do Gemini.
 */
async function getGeminiResponse(userMessage) {
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY não foi encontrada no import.meta.env");
    return "Erro: A chave VITE_GEMINI_API_KEY não foi encontrada no arquivo .env.";
  }

  const siteContent = await fetchAllPagesContent();

  const systemInstruction = `
Você é o Assistente Virtual oficial do Squad F.
Sua única função é responder dúvidas de visitantes usando EXCLUSIVAMENTE o conteúdo extraído das páginas do nosso site fornecido abaixo.

REGRAS OBRIGATÓRIAS:
1. Responda apenas com base nas informações presentes no texto fornecido.
2. Se a resposta para a pergunta NÃO estiver no texto fornecido abaixo, responda EXATAMENTE:
   "Desculpe, não encontrei essa informação nas páginas do nosso site. Posso ajudar com dúvidas sobre a equipe, projetos ou serviços do Squad F."
3. Seja amigável, direto e objective.

CONTEÚDO EXTRAÍDO DO SITE EM TEMPO REAL:
${siteContent}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    // Imprime o erro detalhado no Console (F12) para identificação rápida
    console.error("Erro detalhado da API do Gemini:", error);
    return `Erro na API: ${error.message || "Falha na autenticação ou permissão da chave."}`;
  }
}

/**
 * Renderiza o widget de chat na tela e gerencia a submissão de mensagens.
 */
document.addEventListener("DOMContentLoaded", () => {
  const chatHTML = `
    <div id="chat-widget-container">
      <button id="chat-toggle-btn">🤖 Assistente FIA</button>
      <div id="chat-box" class="chat-hidden">
        <div class="chat-header">
          <span>Assistente Squad F</span>
          <button id="chat-close-btn">&times;</button>
        </div>
        <div id="chat-messages" class="chat-messages">
          <div class="message bot-message">Olá! Sou o assistente do Squad F. Posso tirar dúvidas lendo o conteúdo do nosso site!</div>
        </div>
        <form id="chat-form" class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Pergunte sobre a equipe ou projetos..." autocomplete="off" required>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", chatHTML);

  const toggleBtn = document.getElementById("chat-toggle-btn");
  const closeBtn = document.getElementById("chat-close-btn");
  const chatBox = document.getElementById("chat-box");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  toggleBtn.addEventListener("click", () => chatBox.classList.toggle("chat-hidden"));
  closeBtn.addEventListener("click", () => chatBox.classList.add("chat-hidden"));

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, "user-message");
    chatInput.value = "";

    const typingDiv = appendMessage("Consultando as páginas do site...", "bot-message");

    const botReply = await getGeminiResponse(text);
    typingDiv.textContent = botReply;
  });

  function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }
});