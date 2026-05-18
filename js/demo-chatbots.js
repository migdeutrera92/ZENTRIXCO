(function(){
  'use strict';

  const BASIC_WEBHOOK_URL = 'https://hook.us2.make.com/r67ib0xml2ud8fecd8fjxd35w46gkazx';
  const USE_REAL_BASIC_WEBHOOK = true;
  const WEBHOOK_TIMEOUT_MS = 18000;

  const state = {
    mode: 'basico',
    basico: { history: [], lead: { nombre:'', correo:'', empresa:'', proceso:'' }, stage: 'informativo', connected: USE_REAL_BASIC_WEBHOOK },
    intermedio: { history: [], lead: { nombre:'', correo:'', empresa:'', proceso:'', canal:'', volumen:'', disponibilidad:'' }, stage: 'diagnostico' }
  };

  const DEMOS = {
    basico: {
      title: 'Chatbot Básico',
      subtitle: 'Conectado a Make para responder, orientar y capturar leads simples.',
      welcome: 'Hola 🙌 Soy el demo del Chatbot Básico de ZentrixCo. Puedo responder dudas generales, explicar servicios de automatización y tomar tus datos para contacto manual.\n\nPrueba escribir: “quiero automatizar atención al cliente”, “cuánto cuesta un chatbot” o “quiero que me contacten”.',
      pill: 'Básico · conectado a Make'
    },
    intermedio: {
      title: 'Chatbot Intermedio',
      subtitle: 'Demo segura para visualizar calificación, captura avanzada y ruta hacia agenda.',
      welcome: 'Hola 🙌 Soy el demo del Chatbot Intermedio de ZentrixCo. Además de responder, puedo calificar el proceso, pedir datos clave y llevarte al diagnóstico.\n\nPrueba escribir: “quiero automatizar WhatsApp” o “quiero agendar diagnóstico”.',
      pill: 'Intermedio · demo segura'
    }
  };

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function escapeHtml(str){ return String(str || '').replace(/[&<>'"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]; }); }

  function trackEvent(eventName, params = {}){
    try {
      if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
      if (window.dataLayer && Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...params });
    } catch(err) { /* tracking should never break the demo */ }
  }

  function addBubble(role, text, options){
    const wrap = $('#zcoDemoMessages');
    if(!wrap) return null;
    const div = document.createElement('div');
    div.className = 'zco-chat-bubble ' + role + (options && options.loading ? ' loading' : '');
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    if(!options || !options.skipHistory){
      state[state.mode].history.push({ role, text });
    }
    return div;
  }

  function removeBubble(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }

  function resetChat(mode){
    const wrap = $('#zcoDemoMessages');
    if(!wrap) return;
    wrap.innerHTML = '';
    state[mode].history = [];
    addBubble('bot', DEMOS[mode].welcome);
    updateInsights();
  }



  function clearCurrentChat(){
    const mode = state.mode;

    if(mode === 'basico'){
      state.basico.history = [];
      state.basico.lead = { nombre:'', correo:'', empresa:'', proceso:'' };
      state.basico.stage = 'informativo';
      state.basico.connected = USE_REAL_BASIC_WEBHOOK;
    }

    if(mode === 'intermedio'){
      state.intermedio.history = [];
      state.intermedio.lead = { nombre:'', correo:'', empresa:'', proceso:'', canal:'', volumen:'', disponibilidad:'' };
      state.intermedio.stage = 'diagnostico';
    }

    resetChat(mode);
    const input = $('#zcoDemoInput');
    if(input){ input.value = ''; input.focus(); }
    trackEvent('demo_chat_cleared', { mode: mode, page_location: window.location.href });
  }

  function setMode(mode){
    state.mode = mode;
    const cfg = DEMOS[mode];
    $('#zcoChatTitle').textContent = cfg.title;
    $('#zcoChatSubtitle').textContent = cfg.subtitle;
    $('#zcoChatModePill').textContent = cfg.pill;
    $all('.zco-demo-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    trackEvent('demo_mode_selected', { mode: mode, page_location: window.location.href });
    resetChat(mode);
  }

  function includesAny(text, words){ return words.some(w => text.includes(w)); }

  function normalizeWebhookReply(data){
    if(!data) return '';
    if(typeof data === 'string') {
      try { data = JSON.parse(data); } catch(e) { return data; }
    }
    return data.reply || data.message || data.response || data.text || '';
  }

  function buildBasicPayload(message){
    const history = state.basico.history
      .filter(item => item && item.text)
      .slice(-12)
      .map(item => ({ role: item.role === 'bot' ? 'assistant' : 'user', content: item.text }));

    return {
      message: message,
      history: JSON.stringify(history),
      pageUrl: window.location.href,
      demoType: 'basico',
      source: 'demo-chatbots-web',
      lead: state.basico.lead
    };
  }

  async function postWithTimeout(url, payload){
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const raw = await res.text();
      let data = raw;
      try { data = raw ? JSON.parse(raw) : {}; } catch(e) { /* keep raw text */ }
      if(!res.ok){
        throw new Error('Webhook BASIC respondió con estado ' + res.status);
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function basicReplyFromWebhook(message){
    const payload = buildBasicPayload(message);
    trackEvent('demo_basic_webhook_request', { page_location: window.location.href });
    const data = await postWithTimeout(BASIC_WEBHOOK_URL, payload);
    const reply = normalizeWebhookReply(data);
    if(data && typeof data === 'object'){
      if(data.lead && typeof data.lead === 'object') state.basico.lead = { ...state.basico.lead, ...data.lead };
      if(data.lead_saved === true) state.basico.stage = 'capturado';
      else if(data.intent === 'captura_lead') state.basico.stage = 'captura';
      else if(data.intent === 'servicio_especifico' || data.intent === 'consulta_servicio') state.basico.stage = 'informativo';
    }
    trackEvent('demo_basic_webhook_response', { intent: data && data.intent ? data.intent : 'sin_intent' });
    return reply || 'Puedo ayudarte a revisar automatización de procesos, RPA, IA, Make, n8n o chatbots. ¿Qué proceso quieres mejorar?';
  }

  function basicReplyFallback(message){
    const s = message.toLowerCase();
    const lead = state.basico.lead;
    if (includesAny(s, ['hola','buenas','hey'])) {
      return 'Hola 🙌 ¿Qué proceso te gustaría mejorar o automatizar? Puedo contarte opciones de RPA, IA, integraciones, formularios o chatbot.';
    }
    if (includesAny(s, ['precio','cuesta','valor','tarifa','planes'])) {
      return 'Los valores dependen del proceso, integraciones y nivel de personalización. En esta versión básica puedo tomar tus datos para que el equipo te contacte con una orientación inicial.\n\nEnvíame nombre, correo y proceso que quieres mejorar.';
    }
    if (includesAny(s, ['agendar','diagnóstico','diagnostico','reunión','reunion','llamada','contacten','contacto'])) {
      state.basico.stage = 'captura';
      return 'Perfecto 🙌 En el Chatbot Básico no se agenda automáticamente. Esta versión captura tus datos para contacto manual.\n\nEnvíame nombre, correo y proceso que quieres revisar.';
    }
    if (s.includes('@') || includesAny(s, ['me llamo','soy ','empresa','proceso'])) {
      if (s.includes('@')) lead.correo = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || lead.correo;
      if (includesAny(s, ['atención','atencion','whatsapp','excel','facturación','facturacion','inventario','reportes','leads','correos'])) lead.proceso = message;
      state.basico.stage = 'capturado';
      return 'Gracias 🙌 En una implementación básica, este lead se guarda para que el equipo lo revise manualmente.\n\nDiferencia clave: el básico capta el interés, pero no califica ni agenda de forma automática.';
    }
    if (includesAny(s, ['atención','atencion','whatsapp','excel','facturación','facturacion','inventario','reportes','leads','correos','formulario'])) {
      state.basico.stage = 'informativo';
      return 'Sí, ese proceso se puede automatizar. En una versión básica, el chatbot explica el servicio, resuelve dudas frecuentes y captura datos mínimos si el cliente quiere avanzar.\n\n¿Quieres que te muestre la diferencia con el Intermedio? Allí el bot califica y lleva al agendamiento.';
    }
    return 'Puedo ayudarte con información general sobre automatización, RPA, IA, Make, n8n, formularios, leads o atención al cliente.\n\nPara contacto manual, esta versión pide nombre, correo y proceso.';
  }

  function intermediateReply(message){
    const s = message.toLowerCase();
    const lead = state.intermedio.lead;
    if (includesAny(s, ['hola','buenas','hey'])) {
      state.intermedio.stage = 'diagnostico';
      return 'Hola 🙌 Para orientarte mejor, dime qué proceso quieres mejorar: atención al cliente, ventas, facturación, inventario, reportes u otro.';
    }
    if (includesAny(s, ['atención','atencion','whatsapp','correo','formulario','ventas','leads','facturación','facturacion','inventario','excel','reportes'])) {
      lead.proceso = message;
      state.intermedio.stage = 'calificacion';
      return 'Buen caso para automatización ✅\n\nPara calificarlo mejor: ¿por qué canal ocurre hoy y cuántas solicitudes o repeticiones tienen aproximadamente por semana? Ejemplo: “WhatsApp y correo, 80 por semana”.';
    }
    if (includesAny(s, ['80','50','100','semana','diario','diarias','mensual','whatsapp','correo','crm','excel'])) {
      if (includesAny(s, ['whatsapp'])) lead.canal = 'WhatsApp';
      if (includesAny(s, ['correo'])) lead.canal = lead.canal ? lead.canal + ' + correo' : 'Correo';
      lead.volumen = message;
      state.intermedio.stage = 'agenda';
      return 'Perfecto. Por volumen y repetición, este proceso tiene potencial de automatización medio/alto.\n\nSiguiente paso del Chatbot Intermedio: llevarte al diagnóstico. Envíame nombre, empresa, correo y disponibilidad para una reunión de 30 minutos.';
    }
    if (includesAny(s, ['agendar','diagnóstico','diagnostico','reunión','reunion','llamada'])) {
      state.intermedio.stage = 'agenda';
      return 'Perfecto 🙌 Para agendar el diagnóstico necesito: nombre, empresa, correo, proceso a revisar y disponibilidad de día/hora. Puedes enviarlo todo en un solo mensaje.';
    }
    if (s.includes('@') || includesAny(s, ['mañana','hoy','lunes','martes','miércoles','miercoles','jueves','viernes','10','11','12','14','15','16','17','empresa'])) {
      if (s.includes('@')) lead.correo = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || lead.correo;
      if (includesAny(s, ['mañana','hoy','lunes','martes','miércoles','miercoles','jueves','viernes','10','11','12','14','15','16','17'])) lead.disponibilidad = message;
      state.intermedio.stage = 'validacion';
      return 'Listo. En la versión Intermedia, este punto activaría Make para validar horario real, bloquear fines de semana/feriados, crear evento en Google Calendar, generar Google Meet, guardar el lead y enviar correo de confirmación.\n\nPara esta demo visual, el objetivo es que veas la diferencia: el Intermedio no solo responde, también avanza el proceso comercial.';
    }
    if (includesAny(s, ['precio','cuesta','valor','tarifa','planes'])) {
      return 'El precio depende de integraciones, volumen, canales y reglas del proceso. En la versión intermedia, el bot primero califica el caso para no cotizar “al ojo”.\n\n¿Qué proceso quieres automatizar y cuántas veces se repite por semana?';
    }
    return 'Para darte una respuesta útil necesito entender el proceso. Dime qué tarea se repite, por qué canal ocurre y cuántas veces pasa por semana.';
  }

  async function sendDemoMessage(text){
    const input = $('#zcoDemoInput');
    const message = (text || (input && input.value) || '').trim();
    if(!message) return;
    if(input) input.value = '';
    addBubble('user', message);
    trackEvent('demo_message_sent', { mode: state.mode, page_location: window.location.href });

    const loading = addBubble('bot', state.mode === 'basico' && USE_REAL_BASIC_WEBHOOK ? 'Conectando con el chatbot básico...' : 'Procesando...', { loading: true, skipHistory: true });

    try {
      let reply;
      if(state.mode === 'basico' && USE_REAL_BASIC_WEBHOOK){
        reply = await basicReplyFromWebhook(message);
      } else {
        await new Promise(resolve => setTimeout(resolve, 320));
        reply = intermediateReply(message);
      }
      removeBubble(loading);
      addBubble('bot', reply);
    } catch(err) {
      console.warn('[ZentrixCo demo] Error usando webhook básico:', err);
      removeBubble(loading);
      const fallback = state.mode === 'basico' ? basicReplyFallback(message) : intermediateReply(message);
      addBubble('bot', fallback + '\n\nNota interna: si ves esta respuesta, el webhook no respondió y se activó respaldo local para no romper la demo.');
      trackEvent('demo_basic_webhook_error', { error: String(err && err.message ? err.message : err) });
    }
    updateInsights();
  }

  function updateInsights(){
    const mode = state.mode;
    const current = $('#zcoCurrentModeText');
    const status = $('#zcoStepStatus');
    if(!current || !status) return;
    if(mode === 'basico'){
      current.innerHTML = '<strong>Estás probando: Chatbot Básico conectado a Make</strong><span>Se enfoca en informar, resolver dudas frecuentes y capturar datos mínimos para contacto manual. No agenda automáticamente.</span>';
      const stage = state.basico.stage;
      status.innerHTML = ['Informa','Captura datos','Deriva manualmente','Sin agenda automática'].map(function(x,i){
        const done = (stage === 'captura' && i<2) || (stage === 'capturado' && i<3) || i===0;
        return '<span class="'+(done?'done':'')+'"><em>'+x+'</em><b>'+(done?'✓':'•')+'</b></span>';
      }).join('');
    } else {
      current.innerHTML = '<strong>Estás probando: Chatbot Intermedio en modo seguro</strong><span>Además de responder, califica el lead, solicita datos del proceso y guía hacia el agendamiento. La conexión real se activa después para evitar agendamientos de prueba.</span>';
      const order = ['diagnostico','calificacion','agenda','validacion'];
      const stageIndex = order.indexOf(state.intermedio.stage);
      status.innerHTML = ['Detecta necesidad','Califica lead','Solicita datos','Valida agenda'].map(function(x,i){
        const done = i <= stageIndex;
        return '<span class="'+(done?'done':'')+'"><em>'+x+'</em><b>'+(done?'✓':'•')+'</b></span>';
      }).join('');
    }
  }

  function initCalculator(){
    const form = $('#zcoCalcForm');
    if(!form) return;
    let lastSubmitTracked = false;
    function getSelectedTools(){ return $all('#zcoTools input[type="checkbox"]:checked').map(el => el.value); }
    function moneyCLP(value){ try { return new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(Math.round(value || 0)); } catch(e) { return '$' + Math.round(value || 0).toLocaleString('es-CL'); } }
    function getCostHour(){ const preset = $('#zcoCostPreset')?.value || '8000'; const customWrap = $('#zcoCustomCostWrap'); if(customWrap) customWrap.style.display = preset === 'custom' ? 'block' : 'none'; return preset === 'custom' ? Number($('#zcoCostCustom')?.value || 8000) : Number(preset || 8000); }
    function scoreHours(h){ if(h >= 80) return 30; if(h >= 40) return 25; if(h >= 20) return 18; if(h >= 10) return 12; return 6; }
    function scoreFrequency(f){ if(f >= 20) return 20; if(f >= 10) return 15; if(f >= 5) return 10; return 5; }
    function getSolution(area, channel, tools, score){ const areaText = String(area || '').toLowerCase(); const has = t => tools.includes(t); if(score >= 85 && (tools.length >= 3 || channel === 'mixto')) return 'Hiperautomatización / Chatbot PRO'; if(channel === 'whatsapp' || has('whatsapp') || areaText.includes('atención') || areaText.includes('ventas')) return 'Chatbot Intermedio o Agente IA'; if(channel === 'excel' || has('excel')) return 'RPA, Power Automate o integración'; if(channel === 'correo' || has('correo')) return 'IA + automatización de correos'; if(channel === 'crm' || channel === 'sistema' || has('crm') || has('api')) return 'RPA + API / integración de sistemas'; if(channel === 'formulario') return 'Make/n8n + CRM o Google Sheets'; return 'Automatización a medida con IA, RPA o Make'; }
    function buildRecommendation(priority, solution, hours, annualCost, channel, tools){ const channelLabel = { whatsapp:'WhatsApp o redes sociales', correo:'correo', excel:'Excel o planillas', crm:'CRM/ERP', formulario:'formularios web', sistema:'sistemas internos', mixto:'varios canales' }[channel] || 'tu canal actual'; const base = 'Este proceso consume cerca de ' + hours.toLocaleString('es-CL') + ' horas mensuales y puede representar hasta ' + moneyCLP(annualCost) + ' al año en trabajo manual.'; if(priority === 'alta') return base + ' Por volumen, urgencia o riesgo de error, conviene evaluarlo pronto. La ruta sugerida es ' + solution + ', especialmente porque ocurre en ' + channelLabel + ' y usa ' + (tools.length || 1) + ' herramienta(s).'; if(priority === 'media') return base + ' Tiene potencial de automatización, pero conviene revisar reglas, excepciones e integraciones antes de definir alcance. La ruta sugerida es ' + solution + '.'; return base + ' No parece ser el proceso más crítico todavía, pero puede ser buen candidato si se combina con otros flujos repetitivos. La ruta sugerida inicial es ' + solution + '.'; }
    const calculate = function(e){
      if(e) e.preventDefault();
      const area = $('#zcoArea')?.value || ''; const process = $('#zcoProcess')?.value || 'este proceso'; const channel = $('#zcoChannel')?.value || 'mixto'; const urgency = $('#zcoUrgency')?.value || 'media'; const freq = Number($('#zcoFreq')?.value || 0); const mins = Number($('#zcoMinutes')?.value || 0); const people = Number($('#zcoPeople')?.value || 0); const error = $('#zcoErrors')?.value || 'medio'; const tools = getSelectedTools(); const costHour = getCostHour();
      let hours = (freq * mins * people * 4) / 60; if(!isFinite(hours)) hours = 0; const rounded = Math.round(hours * 10) / 10; const annualHours = Math.round(rounded * 12 * 10) / 10; const monthlyCost = rounded * costHour; const annualCost = monthlyCost * 12;
      let score = scoreHours(rounded) + scoreFrequency(freq) + (people >= 4 ? 15 : people >= 2 ? 10 : 5) + (error === 'alto' ? 15 : error === 'medio' ? 9 : 3) + (urgency === 'alta' ? 10 : urgency === 'media' ? 6 : 2) + (tools.length >= 4 ? 10 : tools.length >= 2 ? 7 : tools.length >= 1 ? 4 : 1); score = Math.max(0, Math.min(100, Math.round(score)));
      let priority = 'baja'; if(score >= 70) priority = 'alta'; else if(score >= 40) priority = 'media'; const solution = getSolution(area, channel, tools, score); const recommendation = buildRecommendation(priority, solution, rounded, annualCost, channel, tools);
      const setText = (sel, value) => { const el = $(sel); if(el) el.textContent = value; };
      setText('#zcoResultNumber', String(rounded).replace('.', ',')); setText('#zcoAnnualHours', String(annualHours).replace('.', ',')); setText('#zcoMonthlyCost', moneyCLP(monthlyCost)); setText('#zcoAnnualCost', moneyCLP(annualCost)); setText('#zcoAutomationScore', String(score)); setText('#zcoSolution', solution); setText('#zcoRecommendation', recommendation); setText('#zcoResultText', 'Proceso evaluado: ' + process + '. Esta estimación considera frecuencia, duración, personas involucradas, errores, urgencia y herramientas actuales.');
      const scoreFill = $('#zcoScoreFill'); if(scoreFill) scoreFill.style.width = score + '%'; const badge = $('#zcoPriorityBadge'); if(badge){ badge.textContent = 'Prioridad ' + priority.toUpperCase(); badge.className = 'zco-priority ' + priority; }
      const msg = encodeURIComponent('Hola, hice el diagnóstico express de automatización en ZentrixCo. Proceso: ' + process + '. Resultado: ' + rounded + ' horas mensuales, score ' + score + '/100, prioridad ' + priority + ', solución sugerida: ' + solution + '. Quiero revisar este caso.'); const link = $('#zcoCalcAgenda'); if(link){ link.href = '/contacto?mensaje=' + msg + '#formulario-contacto'; link.textContent = priority === 'alta' ? 'Agendar diagnóstico prioritario' : priority === 'media' ? 'Revisar este proceso' : 'Detectar mejor proceso'; }
      if(e && !lastSubmitTracked){ trackEvent('automation_calculator_completed', { monthly_hours: rounded, annual_hours: annualHours, monthly_cost: Math.round(monthlyCost), priority: priority, score: score, solution: solution }); lastSubmitTracked = true; }
      if(!e) lastSubmitTracked = false;
    };
    form.addEventListener('submit', calculate);
    ['#zcoArea','#zcoProcess','#zcoChannel','#zcoUrgency','#zcoFreq','#zcoMinutes','#zcoPeople','#zcoErrors','#zcoCostPreset','#zcoCostCustom'].forEach(sel => { const el = $(sel); if(el) el.addEventListener('input', function(){ lastSubmitTracked = false; calculate(); }); });
    $all('#zcoTools input[type="checkbox"]').forEach(el => el.addEventListener('change', function(){ lastSubmitTracked = false; calculate(); }));
    calculate();
  }

  function initDemo(){
    if(!$('#zcoDemoMessages')) return;
    trackEvent('demo_chatbot_view', { page_location: window.location.href });
    $all('.zco-demo-mode-btn').forEach(btn => btn.addEventListener('click', function(){ setMode(btn.dataset.mode || 'basico'); }));
    $all('[data-demo-prompt]').forEach(btn => btn.addEventListener('click', function(){ sendDemoMessage(btn.dataset.demoPrompt); }));
    $all('a[href*="contacto#formulario-contacto"]').forEach(link => link.addEventListener('click', function(){ trackEvent('diagnostic_cta_click', { page_location: window.location.href, link_text: link.textContent.trim() }); }));
    const send = $('#zcoDemoSend');
    const input = $('#zcoDemoInput');
    const clear = $('#zcoClearChat');
    if(send) send.addEventListener('click', function(){ sendDemoMessage(); });
    if(input) input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); sendDemoMessage(); } });
    if(clear) clear.addEventListener('click', clearCurrentChat);
    setMode('basico');
  }

  document.addEventListener('DOMContentLoaded', function(){ initDemo(); initCalculator(); });
})();
