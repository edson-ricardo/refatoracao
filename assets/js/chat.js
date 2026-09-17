// Base de Conhecimento extraída estritamente do conteúdo do Squad F
const KNOWLEDGE_BASE = [
  {
    keywords: ["quem somos", "sobre", "equipe", "integrantes", "membros", "squad f"],
    response: "O Squad F é uma equipe de desenvolvedores formada por Daniel (Front-end), Edson (QA/Back-end), Felipe (UI/UX) e Elisson (Gerente de Projetos). Atuamos com soluções web, educação e acessibilidade."
  },
  {
    keywords: ["projetos", "plataforma", "dashboard", "site institucional", "leitura"],
    response: "Nossos projetos incluem: 1) Plataforma de Aprendizagem Web; 2) Dashboard de Indicadores Escolares; 3) Site Institucional para Escola; 4) Ferramenta de Apoio à Leitura."
  },
  {
    keywords: ["servicos", "serviços", "o que fazem", "desenvolvimento", "consultoria"],
    response: "Oferecemos: Desenvolvimento de Sites, Desenvolvimento de Sistemas Web, Consultoria Educacional, Design de Interfaces (UI/UX), Implementação de Dashboards e Suporte Técnico."
  },
  {
    keywords: ["habilidades", "tecnologias", "html", "css", "js", "javascript", "git"],
    response: "Nossas habilidades incluem HTML5 (Avançado), CSS3 (Intermediário/Avançado), JavaScript (Intermediário), Git & GitHub (Intermediário), Design Responsivo e Comunicação em Equipe."
  },
  {
    keywords: ["contato", "falar", "email", "e-mail", "mensagem"],
    response: "Você pode entrar em contato conosco através do formulário na nossa página de Contato enviando seu nome, e-mail e mensagem."
  },
  {
    keywords: ["case", "sucesso", "escola", "resultado"],
    response: "Nosso Case de Sucesso ajudou uma escola parceira a centralizar avisos, calendários e notas, modernizando a comunicação entre alunos, pais e coordenação."
  }
];

// Mensagem padrão para evitar alucinações
const DEFAULT_RESPONSE = "Desculpe, não tenho essa informação solicitada. Posso responder apenas dúvidas sobre a equipe Squad F, nossos projetos, serviços, habilidades e formas de contato.";

// Função para buscar a resposta na Base de Conhecimento
function getBotResponse(userMessage) {
  const cleanInput = userMessage.toLowerCase().trim();

  for (const item of KNOWLEDGE_BASE) {
    const matched = item.keywords.some(keyword => cleanInput.includes(keyword));
    if (matched) {
      return item.response;
    }
  }

  return DEFAULT_RESPONSE;
}

// Injeção do HTML do Chat no DOM ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  const chatHTML = `
    <div id="chat-widget-container">
      <button id="chat-toggle-btn">🤖 Assistente FIA</button>
      <div id="chat-box" class="chat-hidden">
        <div class="chat-header">
          <span>Assistente FIA</span>
          <button id="chat-close-btn">&times;</button>
        </div>
        <div id="chat-messages" class="chat-messages">
          <div class="message bot-message">Olá! Sou o assistente do Squad F. Como posso te ajudar com nosso site?</div>
        </div>
        <form id="chat-form" class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Pergunte sobre nossos serviços..." autocomplete="off" required>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", chatHTML);

  // Seleção de Elementos
  const toggleBtn = document.getElementById("chat-toggle-btn");
  const closeBtn = document.getElementById("chat-close-btn");
  const chatBox = document.getElementById("chat-box");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  // Alternar Visibilidade
  toggleBtn.addEventListener("click", () => chatBox.classList.toggle("chat-hidden"));
  closeBtn.addEventListener("click", () => chatBox.classList.add("chat-hidden"));

  // Processar Mensagens
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Mensagem do Usuário
    appendMessage(text, "user-message");
    chatInput.value = "";

    // Resposta do Bot com delay simular digitação
    setTimeout(() => {
      const botReply = getBotResponse(text);
      appendMessage(botReply, "bot-message");
    }, 400);
  });

  function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});