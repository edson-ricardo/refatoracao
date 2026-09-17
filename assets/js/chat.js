import { GoogleGenAI } from "https://esm.run/@google/genai";

// Leitura das variáveis do arquivo .env via Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";

// Inicialização do cliente oficial do Gemini
let ai = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.error("VITE_GEMINI_API_KEY não encontrada no arquivo .env");
  }
} catch (e) {
  console.error("Erro ao inicializar SDK do Gemini:", e);
}

// Lista de páginas do site apontando diretamente para a raiz pública
const PAGES_TO_SCRAPE = [
  "/index.html",
  "/sobre.html",
  "/contato.html",
  "/projetos.html",
  "/habilidades.html",
  "/servicos.html",
  "/depoimentos.html",
  "/case-de-sucesso.html"
];

let cachedSiteData = "";

/**
 * Lê o HTML de todas as páginas listadas e extrai o texto limpo
 * É o leitor do assistente
 */
async function fetchAllPagesContent() {
  if (cachedSiteData && cachedSiteData.trim().length > 0) {
    return cachedSiteData;
  }

  let combinedText = "";

  for (const page of PAGES_TO_SCRAPE) {
    try {
      const response = await fetch(page, { cache: "no-store" });
      
      if (response.ok) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Remove scripts, estilos, navegadores e o widget do chat
        doc.querySelectorAll("script, style, header, nav, #chat-widget-container").forEach(el => el.remove());

        const pageCleanText = doc.body.textContent.replace(/\s+/g, ' ').trim();
        if (pageCleanText.length > 0) {
          combinedText += `\n--- CONTEÚDO DA PÁGINA (${page}) ---\n${pageCleanText}\n`;
        }
      } else {
        console.warn(`Página não encontrada (${response.status}): ${page}`);
      }
    } catch (error) {
      console.warn(`Erro ao buscar página ${page}:`, error);
    }
  }

  cachedSiteData = combinedText;
  return combinedText;
}

/**
 * Envia a mensagem do usuário para a API do Gemini
 */
async function getGeminiResponse(userMessage) {
  if (!ai) {
    return "Erro de configuração: Chave de API não foi encontrada no arquivo .env.";
  }

  const siteContent = await fetchAllPagesContent();

  const systemInstruction = `
Você é o Assistente Virtual oficial do Squad F.
Sua única função é responder dúvidas de visitantes usando EXCLUSIVAMENTE o conteúdo extraído das páginas do nosso site fornecido abaixo.

REGRAS OBRIGATÓRIAS:
1. Responda apenas com base nas informações presentes no texto fornecido.
2. Se a resposta para a pergunta NÃO estiver no texto fornecido abaixo, responda EXATAMENTE:
   "Desculpe, não encontrei essa informação nas páginas do nosso site. Posso ajudar com dúvidas sobre a equipe, projetos ou serviços do Squad F."
3. Seja amigável, direto e objetivo.

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
    console.error("Erro na API do Gemini:", error);

    const errorMessage = error?.message || "";

    // Trata instabilidade/pico de demanda do servidor do Google (Erro 503)
    if (errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE")) {
      return "O serviço de inteligência artificial está com alta demanda no momento. Por favor, aguarde alguns instantes e tente novamente!";
    }

    // Trata erro de autenticação ou chave inválida
    if (errorMessage.includes("401") || errorMessage.includes("API key")) {
      return "Erro de autenticação: Verifique se a sua chave de API no arquivo .env está correta.";
    }

    // Mensagem de falha genérica amigável
    return "Desculpe, ocorreu uma falha temporária ao consultar o assistente. Por favor, tente novamente em alguns instantes.";
  }
}

/**
 * Converte marcação simples de negrito do Markdown (**texto**) para tag HTML (<strong>texto</strong>)
 */
function formatMarkdown(text) {
  if (!text) return "";
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Renderização e controle do Widget de Chat na interface
 */
function initChatWidget() {
  if (document.getElementById("chat-widget-container")) return;

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

    try {
      const botReply = await getGeminiResponse(text);
      typingDiv.innerHTML = formatMarkdown(botReply);
    } catch (err) {
      console.error("Erro inesperado na execução do chat:", err);
      typingDiv.textContent = "Ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  });

  function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatWidget);
} else {
  initChatWidget();
}