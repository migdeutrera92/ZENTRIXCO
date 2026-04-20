/**
 * ZentrixCo Floating Chat Widget
 * Chatbot inteligente con soporte para webhook externo (n8n / Make).
 *
 * CONFIGURACION DE WEBHOOK (n8n / Make)
 * Para conectar este chatbot con n8n o Make, pega tu URL de webhook aqui:
 */
var WEBHOOK_URL = "";
/**
 * Ejemplo n8n:  "https://tu-instancia-n8n.com/webhook/xxxxxxxx"
 * Ejemplo Make: "https://hook.us1.make.com/xxxxxxxxxxxxxxxx"
 *
 * El widget enviara un POST con JSON: { name, email, message, page, timestamp }
 * y espera una respuesta JSON con: { reply: "texto de respuesta" }
 *
 * Si WEBHOOK_URL esta vacio, el chatbot funcionara con respuestas locales.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'zentrixco_chat_history';

  var FAQ_RESPONSES = {
    'rpa': 'Automatizacion RPA: Automatizamos tareas repetitivas como procesamiento de documentos, migracion de datos y gestion de correos. Nuestros bots RPA operan 24/7 con precision del 99%.',
    'automatizacion': 'Ofrecemos servicios completos de automatizacion: RPA, Agentes IA, Integraciones (n8n/Make) e Hiperautomatizacion. Podemos reducir tus costos operativos hasta un 70%.',
    'precio': 'Nuestros precios varian segun la complejidad del proyecto. Ofrecemos un diagnostico gratuito donde evaluamos tus procesos y te damos una cotizacion personalizada.',
    'n8n': 'Somos expertos en n8n y Make (Integromat). Creamos workflows personalizados para conectar tus APIs, bases de datos y servicios en la nube.',
    'make': 'Trabajamos con Make (Integromat) para crear escenarios visuales de automatizacion sin codigo. Ideal para conectar herramientas como CRM, email marketing, ERPs y mas.',
    'ia': 'Nuestros Agentes IA incluyen chatbots inteligentes, analisis predictivo y automatizacion cognitiva. Pueden aprender, decidir y ejecutar tareas complejas de forma autonoma.',
    'contacto': 'Puedes contactarnos a traves de nuestra pagina de contacto: zentrixco.com/contacto. Tambien puedes agendar una consultoria gratuita directamente desde ahi.',
    'diagnostico': 'Ofrecemos un diagnostico gratuito donde auditamos tus procesos actuales e identificamos oportunidades de automatizacion. Sin compromiso!',
    'industria': 'Trabajamos con multiples industrias: Finanzas, Retail, Salud y Logistica. Cual es tu sector?',
    'finanzas': 'En Finanzas: automatizamos conciliacion bancaria, deteccion de fraude con IA, reporteria regulatoria y procesamiento de creditos. Reduccion de errores del 85%.',
    'retail': 'En Retail: gestion de inventario inteligente, pricing dinamico con IA, chatbots de atencion y analisis predictivo de demanda. Aumento de ventas del 25%.',
    'salud': 'En Salud: agendamiento automatico de citas, procesamiento de fichas clinicas, gestion de seguros y seguimiento de pacientes. 70% menos tiempo administrativo.',
    'logistica': 'En Logistica: tracking en tiempo real, optimizacion de rutas con IA, gestion de bodega automatizada. 30% ahorro en combustible y 95% entregas a tiempo.',
    'hola': 'Hola! Soy el asistente virtual de ZentrixCo. Puedo ayudarte con informacion sobre nuestros servicios de automatizacion RPA, IA e integraciones. En que te puedo ayudar?',
    'gracias': 'De nada! Si necesitas mas informacion o quieres agendar una consultoria gratuita, no dudes en preguntar.',
    'horario': 'Nuestro equipo esta disponible de lunes a viernes, 9:00 a 18:00 hrs (Chile). Sin embargo, puedes dejarnos tu consulta aqui y te responderemos lo antes posible.',
    'chile': 'Estamos ubicados en Chile y atendemos a empresas en toda Latinoamerica. Nuestros servicios se pueden implementar de forma remota.',
  };

  var DEFAULT_RESPONSE = 'Gracias por tu pregunta. Para darte la mejor respuesta, te recomiendo agendar una consultoria gratuita donde un experto podra atenderte personalmente. Visita nuestra pagina de contacto o preguntame sobre: RPA, IA, integraciones, precios o nuestras soluciones por industria.';

  function getLocalResponse(message) {
    var lowerMsg = message.toLowerCase();
    var bestMatch = null;
    var bestScore = 0;
    for (var key in FAQ_RESPONSES) {
      if (lowerMsg.indexOf(key) !== -1) {
        if (key.length > bestScore) {
          bestScore = key.length;
          bestMatch = FAQ_RESPONSES[key];
        }
      }
    }
    return bestMatch || DEFAULT_RESPONSE;
  }

  function getChatHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveChatHistory(history) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50))); }
    catch (e) { /* ignore */ }
  }

  /* ── Inject CSS directly (no bundler needed) ─────────────────────────── */
  var style = document.createElement('style');
  style.textContent = `
/* ===== FLOATING CHAT WIDGET ===== */
.chat-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8652e, #7b2d8e);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px rgba(232, 101, 46, 0.4);
  transition: all 0.3s ease;
  animation: chat-fab-pulse 2s infinite;
}
.chat-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 32px rgba(232, 101, 46, 0.55);
}
.chat-fab svg {
  width: 28px;
  height: 28px;
  fill: #fff;
  transition: transform 0.3s ease;
}
.chat-fab.open svg.icon-chat { display: none; }
.chat-fab.open svg.icon-close { display: block; }
.chat-fab:not(.open) svg.icon-chat { display: block; }
.chat-fab:not(.open) svg.icon-close { display: none; }
@keyframes chat-fab-pulse {
  0%, 100% { box-shadow: 0 6px 24px rgba(232, 101, 46, 0.4); }
  50% { box-shadow: 0 6px 32px rgba(232, 101, 46, 0.6); }
}
.chat-fab.open { animation: none; }

/* Chat Panel */
.chat-panel {
  position: fixed;
  bottom: 100px;
  right: 28px;
  z-index: 9998;
  width: 370px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0.35s;
}
.chat-panel.visible {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0s;
}

/* Panel Header */
.chat-panel-header {
  background: linear-gradient(135deg, #1a3a6b, #e8652e);
  padding: 22px 24px;
  color: #fff;
}
.chat-panel-header h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.chat-panel-header p {
  font-size: 0.82rem;
  opacity: 0.85;
  margin: 0;
  line-height: 1.4;
}

/* Panel Body */
.chat-panel-body {
  display: flex;
  flex-direction: column;
  max-height: 420px;
}

/* Chat Messages Area */
.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.chat-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.5;
  animation: chat-msg-in 0.3s ease;
}
@keyframes chat-msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.chat-msg.bot {
  align-self: flex-start;
  background: #f0f4ff;
  color: #333;
  border-bottom-left-radius: 4px;
}
.chat-msg.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #e8652e, #c4501a);
  color: #fff;
  border-bottom-right-radius: 4px;
}

/* Input area */
.chat-input-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}
.chat-input-area textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Open Sans', sans-serif;
  font-size: 0.88rem;
  color: #333;
  background: #fafafa;
  resize: none;
  min-height: 44px;
  max-height: 100px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  outline: none;
}
.chat-input-area textarea:focus {
  border-color: #e8652e;
}
.chat-submit-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #e8652e, #d4541e);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}
.chat-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(232, 101, 46, 0.35);
}
.chat-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Badge */
.chat-fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #28a745;
  border: 2px solid #fff;
  animation: chat-badge-pulse 1.5s infinite;
}
@keyframes chat-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.chat-fab.open .chat-fab-badge { display: none; }

/* Typing */
.chat-typing { display: flex; gap: 4px; align-items: center; padding: 8px 16px !important; min-height: auto !important; }
.typing-dot { width: 8px; height: 8px; border-radius: 50%; background: #bbb; animation: typingBounce 1.4s ease-in-out infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Mobile */
@media (max-width: 480px) {
  .chat-panel { right: 10px; bottom: 90px; width: calc(100vw - 20px); border-radius: 16px; }
  .chat-fab { bottom: 20px; right: 20px; width: 54px; height: 54px; }
  .chat-fab svg { width: 24px; height: 24px; }
}
  `;
  document.head.appendChild(style);

  /* ── Build FAB ────────────────────────────────────────────────────────── */
  var fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Abrir chat de contacto');

  var chatSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chatSvg.setAttribute('class', 'icon-chat');
  chatSvg.setAttribute('viewBox', '0 0 24 24');
  var chatPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  chatPath1.setAttribute('fill', '#ffffff');
  chatPath1.setAttribute('d', 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z');
  var chatPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  chatPath2.setAttribute('fill', '#ffffff');
  chatPath2.setAttribute('d', 'M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z');
  chatSvg.appendChild(chatPath1);
  chatSvg.appendChild(chatPath2);

  var closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  closeSvg.setAttribute('class', 'icon-close');
  closeSvg.setAttribute('viewBox', '0 0 24 24');
  var closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  closePath.setAttribute('fill', '#ffffff');
  closePath.setAttribute('d', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
  closeSvg.appendChild(closePath);

  var badge = document.createElement('span');
  badge.className = 'chat-fab-badge';

  fab.appendChild(badge);
  fab.appendChild(chatSvg);
  fab.appendChild(closeSvg);

  /* ── Build Panel ──────────────────────────────────────────────────────── */
  var panel = document.createElement('div');
  panel.className = 'chat-panel';

  var panelHeader = document.createElement('div');
  panelHeader.className = 'chat-panel-header';
  panelHeader.innerHTML = '<h3>Asistente ZentrixCo</h3><p>Preguntame sobre nuestros servicios de automatizacion.</p>';

  var panelBody = document.createElement('div');
  panelBody.className = 'chat-panel-body';

  var messagesEl = document.createElement('div');
  messagesEl.className = 'chat-messages';
  messagesEl.id = 'chatMessages';

  /* Load history or show welcome */
  var history = getChatHistory();
  if (history.length > 0) {
    history.forEach(function (item) {
      var bubble = document.createElement('div');
      bubble.className = 'chat-msg ' + item.role;
      bubble.textContent = item.text;
      messagesEl.appendChild(bubble);
    });
  } else {
    var welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'chat-msg bot';
    welcomeMsg.textContent = 'Hola! Soy el asistente virtual de ZentrixCo. Puedo ayudarte con informacion sobre RPA, IA, integraciones y mas. En que te puedo ayudar?';
    messagesEl.appendChild(welcomeMsg);
  }

  /* Input area */
  var inputArea = document.createElement('div');
  inputArea.className = 'chat-input-area';

  var textarea = document.createElement('textarea');
  textarea.placeholder = 'Escribe tu pregunta...';
  textarea.rows = 1;

  var submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'chat-submit-btn';
  submitBtn.textContent = 'Enviar';

  inputArea.appendChild(textarea);
  inputArea.appendChild(submitBtn);

  panelBody.appendChild(messagesEl);
  panelBody.appendChild(inputArea);

  panel.appendChild(panelHeader);
  panel.appendChild(panelBody);

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  /* ── Event Listeners ──────────────────────────────────────────────────── */
  textarea.addEventListener('focus', function () { this.style.borderColor = '#e8652e'; });
  textarea.addEventListener('blur', function () { this.style.borderColor = '#e0e0e0'; });
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  submitBtn.addEventListener('click', sendMessage);

  /* Toggle panel */
  fab.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = fab.classList.contains('open');
    if (isOpen) {
      fab.classList.remove('open');
      panel.classList.remove('visible');
    } else {
      fab.classList.add('open');
      panel.classList.add('visible');
      setTimeout(function () { messagesEl.scrollTop = messagesEl.scrollHeight; }, 100);
    }
  });

  document.addEventListener('click', function (e) {
    if (!fab.contains(e.target) && !panel.contains(e.target) && fab.classList.contains('open')) {
      fab.classList.remove('open');
      panel.classList.remove('visible');
    }
  });

  /* ── Messaging Logic ──────────────────────────────────────────────────── */
  function addMessage(text, role) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-msg ' + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var chatHistory = getChatHistory();
    chatHistory.push({ role: role, text: text, time: new Date().toISOString() });
    saveChatHistory(chatHistory);
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'chat-msg bot chat-typing';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  function sendMessage() {
    var message = textarea.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    textarea.value = '';
    textarea.style.height = 'auto';
    submitBtn.disabled = true;
    submitBtn.textContent = '...';
    showTyping();

    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        addMessage((data && data.reply) ? data.reply : 'Gracias por tu mensaje. Un experto te contactara pronto.', 'bot');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      })
      .catch(function () {
        hideTyping();
        addMessage('Lo siento, hubo un error de conexion. Por favor intenta de nuevo o visita nuestra pagina de contacto.', 'bot');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      });
    } else {
      setTimeout(function () {
        hideTyping();
        addMessage(getLocalResponse(message), 'bot');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      }, 800 + Math.random() * 600);
    }
  }

})();
