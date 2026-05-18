
(function(){
  'use strict';

  const state = {
    mode: 'basico',
    basico: { history: [], lead: { nombre:'', correo:'', empresa:'', proceso:'' }, stage: 'informativo' },
    intermedio: { history: [], lead: { nombre:'', correo:'', empresa:'', proceso:'', canal:'', volumen:'', disponibilidad:'' }, stage: 'diagnostico' }
  };

  const DEMOS = {
    basico: {
      title: 'Chatbot Básico',
      subtitle: 'Responde dudas y captura datos mínimos para contacto manual.',
      welcome: 'Hola 🙌 Soy el demo del Chatbot Básico de ZentrixCo. Puedo responder dudas generales, explicar servicios y tomar tus datos para que el equipo te contacte.\n\nPrueba escribir: “quiero automatizar atención al cliente” o “quiero que me contacten”.',
      pill: 'Básico · informa y capta'
    },
    intermedio: {
      title: 'Chatbot Intermedio',
      subtitle: 'Califica, pide datos clave y guía hacia el agendamiento.',
      welcome: 'Hola 🙌 Soy el demo del Chatbot Intermedio de ZentrixCo. Además de responder, puedo calificar el proceso, pedir datos clave y llevarte al diagnóstico.\n\nPrueba escribir: “quiero automatizar WhatsApp” o “quiero agendar diagnóstico”.',
      pill: 'Intermedio · califica y agenda'
    }
  };

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function escapeHtml(str){ return String(str || '').replace(/[&<>'"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]; }); }

  function addBubble(role, text){
    const wrap = $('#zcoDemoMessages');
    if(!wrap) return;
    const div = document.createElement('div');
    div.className = 'zco-chat-bubble ' + role;
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    state[state.mode].history.push({ role, text });
  }

  function resetChat(mode){
    const wrap = $('#zcoDemoMessages');
    if(!wrap) return;
    wrap.innerHTML = '';
    state[mode].history = [];
    addBubble('bot', DEMOS[mode].welcome);
    updateInsights();
  }

  function setMode(mode){
    state.mode = mode;
    const cfg = DEMOS[mode];
    $('#zcoChatTitle').textContent = cfg.title;
    $('#zcoChatSubtitle').textContent = cfg.subtitle;
    $('#zcoChatModePill').textContent = cfg.pill;
    $all('.zco-demo-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    resetChat(mode);
  }

  function includesAny(text, words){ return words.some(w => text.includes(w)); }

  function basicReply(message){
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

  function sendDemoMessage(text){
    const input = $('#zcoDemoInput');
    const message = (text || (input && input.value) || '').trim();
    if(!message) return;
    if(input) input.value = '';
    addBubble('user', message);
    setTimeout(function(){
      const reply = state.mode === 'basico' ? basicReply(message) : intermediateReply(message);
      addBubble('bot', reply);
      updateInsights();
    }, 320);
  }

  function updateInsights(){
    const mode = state.mode;
    const current = $('#zcoCurrentModeText');
    const status = $('#zcoStepStatus');
    if(!current || !status) return;
    if(mode === 'basico'){
      current.innerHTML = '<strong>Estás probando: Chatbot Básico</strong><span>Se enfoca en informar, resolver dudas frecuentes y capturar datos mínimos. No agenda automáticamente.</span>';
      const stage = state.basico.stage;
      status.innerHTML = ['Informa','Captura datos','Deriva manualmente','Sin agenda automática'].map(function(x,i){
        const done = (stage === 'captura' && i<2) || (stage === 'capturado' && i<3) || i===0;
        return '<span class="'+(done?'done':'')+'"><em>'+x+'</em><b>'+(done?'✓':'•')+'</b></span>';
      }).join('');
    } else {
      current.innerHTML = '<strong>Estás probando: Chatbot Intermedio</strong><span>Además de responder, califica el lead, solicita datos del proceso y guía hacia el agendamiento.</span>';
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
    const calculate = function(e){
      if(e) e.preventDefault();
      const freq = Number($('#zcoFreq')?.value || 0);
      const mins = Number($('#zcoMinutes')?.value || 0);
      const people = Number($('#zcoPeople')?.value || 0);
      const error = $('#zcoErrors')?.value || 'medio';
      let hours = (freq * mins * people * 4) / 60;
      if(!isFinite(hours)) hours = 0;
      const rounded = Math.round(hours * 10) / 10;
      let priority = 'baja';
      if(rounded >= 31 || (rounded >= 20 && error === 'alto')) priority = 'alta';
      else if(rounded >= 11 || error === 'medio') priority = 'media';
      const num = $('#zcoResultNumber');
      const badge = $('#zcoPriorityBadge');
      const text = $('#zcoResultText');
      if(num) num.textContent = String(rounded).replace('.', ',');
      if(badge){ badge.textContent = 'Prioridad ' + priority.toUpperCase(); badge.className = 'zco-priority ' + priority; }
      if(text){
        const process = $('#zcoProcess')?.value || 'este proceso';
        text.textContent = 'Tu empresa dedica aproximadamente ' + rounded.toLocaleString('es-CL') + ' horas al mes a ' + process + '. Si esta tarea se repite, consume tiempo humano o genera errores, es candidata para automatización con RPA, IA, integraciones o agentes inteligentes.';
      }
      const msg = encodeURIComponent('Hola, hice la calculadora de ZentrixCo y quiero revisar mi proceso. Resultado aproximado: ' + rounded + ' horas mensuales.');
      const link = $('#zcoCalcAgenda');
      if(link) link.href = '/contacto#formulario-contacto?mensaje=' + msg;
    };
    form.addEventListener('submit', calculate);
    ['#zcoFreq','#zcoMinutes','#zcoPeople','#zcoErrors','#zcoProcess'].forEach(sel => { const el = $(sel); if(el) el.addEventListener('input', calculate); });
    calculate();
  }

  function initDemo(){
    if(!$('#zcoDemoMessages')) return;
    $all('.zco-demo-mode-btn').forEach(btn => btn.addEventListener('click', function(){ setMode(btn.dataset.mode || 'basico'); }));
    $all('[data-demo-prompt]').forEach(btn => btn.addEventListener('click', function(){ sendDemoMessage(btn.dataset.demoPrompt); }));
    const send = $('#zcoDemoSend');
    const input = $('#zcoDemoInput');
    if(send) send.addEventListener('click', function(){ sendDemoMessage(); });
    if(input) input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); sendDemoMessage(); } });
    setMode('basico');
  }

  document.addEventListener('DOMContentLoaded', function(){ initDemo(); initCalculator(); });
})();
