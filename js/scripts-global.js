// ===== ZentrixCo Global Scripts - Menú móvil y utilidades globales =====
(function () {
  function initMobileMenu() {
    var mobileToggle = document.getElementById('mobileToggle');
    var nav = document.getElementById('nav');

    if (!mobileToggle || !nav) return;
    if (mobileToggle.dataset.zcoMenuReady === 'true') return;
    mobileToggle.dataset.zcoMenuReady = 'true';

    mobileToggle.setAttribute('aria-label', 'Abrir menú');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-controls', 'nav');
    mobileToggle.setAttribute('type', 'button');

    function isOpen() {
      return nav.classList.contains('open') || nav.classList.contains('active');
    }

    function openMenu() {
      nav.classList.add('open', 'active');
      mobileToggle.classList.add('active');
      document.body.classList.add('menu-open');
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileToggle.setAttribute('aria-label', 'Cerrar menú');
    }

    function closeMenu() {
      nav.classList.remove('open', 'active');
      mobileToggle.classList.remove('active');
      document.body.classList.remove('menu-open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Abrir menú');
    }

    mobileToggle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      isOpen() ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (event) {
      if (window.innerWidth > 1200) return;
      if (!nav.contains(event.target) && !mobileToggle.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1200) closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();

// ===== Header Shadow on Scroll =====
(function () {
  var header = document.getElementById('header');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 50) {
      header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.12)';
    } else {
      header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
})();

// ===== Scroll Reveal Animation =====
(function () {
  function revealOnScroll() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('revealed');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll, { passive: true });
  window.addEventListener('load', revealOnScroll);
})();

// ===== Servicios Page - Scroll Animations =====
(function () {
  function initSvcAnimations() {
    var allElements = [];
    document.querySelectorAll('.svc-card, .svc-section, .process-step').forEach(function (el) {
      allElements.push(el);
    });

    if (!allElements.length) return;

    allElements.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.classList.remove('will-animate');
      el.classList.add('animate-in');
    });

    if ('IntersectionObserver' in window) {
      allElements.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight + 50) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(40px)';
          el.classList.add('will-animate');
          el.classList.remove('animate-in');
        }
      });

      var svcObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('animate-in');
            entry.target.classList.remove('will-animate');
            svcObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

      allElements.forEach(function (el) {
        if (el.classList.contains('will-animate')) svcObserver.observe(el);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSvcAnimations);
  } else {
    initSvcAnimations();
  }
  window.addEventListener('load', initSvcAnimations);
})();

// ===== Contact Form Handling (legacy fallback para formularios antiguos) =====
(function () {
  var contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    setTimeout(function () {
      showNotification('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'success');
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });
})();

// ===== Notification System =====
function showNotification(message, type) {
  var existing = document.querySelector('.notification');
  if (existing) existing.remove();

  var notification = document.createElement('div');
  notification.className = 'notification notification-' + type;
  notification.innerHTML =
    '<span>' + message + '</span>' +
    '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;margin-left:12px;">&times;</button>';

  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '16px 24px',
    borderRadius: '10px',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: '9999',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    background: type === 'success'
      ? 'linear-gradient(135deg, #28a745, #20c997)'
      : 'linear-gradient(135deg, #dc3545, #e8652e)'
  });

  document.body.appendChild(notification);

  setTimeout(function () {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        if (notification.parentNode) notification.remove();
      }, 300);
    }
  }, 4000);
}

// ===== Industry Tabs =====
(function () {
  document.querySelectorAll('.industry-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.industry-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      var target = tab.dataset.target;
      document.querySelectorAll('.industry-panel').forEach(function (panel) {
        panel.style.display = 'none';
      });
      var targetPanel = document.getElementById(target);
      if (targetPanel) targetPanel.style.display = 'block';
    });
  });
})();

// ===== ROI Calculator =====
function updateCalculator() {
  var employees = document.getElementById('calcEmployees');
  var hours = document.getElementById('calcHours');
  var cost = document.getElementById('calcCost');

  if (!employees || !hours || !cost) return;

  var empVal = parseInt(employees.value, 10) || 0;
  var hoursVal = parseInt(hours.value, 10) || 0;
  var costVal = parseInt(cost.value, 10) || 0;

  var empValue = document.getElementById('empValue');
  var hoursValue = document.getElementById('hoursValue');
  var costValue = document.getElementById('costValue');

  if (empValue) empValue.textContent = empVal;
  if (hoursValue) hoursValue.textContent = hoursVal + 'h';
  if (costValue) costValue.textContent = '$' + costVal;

  var monthlySaving = empVal * hoursVal * (costVal / 160) * 0.7;
  var annualSaving = monthlySaving * 12;

  var resultEl = document.getElementById('calcResultValue');
  if (resultEl) {
    resultEl.textContent = '$' + Math.round(annualSaving).toLocaleString() + ' USD/año';
  }
}

window.addEventListener('load', function () {
  if (document.getElementById('calcEmployees')) updateCalculator();
});

// ===== Smooth Scroll for internal anchor links =====
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      var headerHeight = document.getElementById('header') ? document.getElementById('header').offsetHeight : 0;
      var targetPosition = target.offsetTop - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });
})();

// ===== Floating Atom Particles for Page Hero =====
(function () {
  var hero = document.querySelector('.page-hero');
  if (!hero) return;
  if (hero.querySelector('.hero-particles')) return;

  var particleContainer = document.createElement('div');
  particleContainer.className = 'hero-particles';
  particleContainer.setAttribute('aria-hidden', 'true');
  hero.appendChild(particleContainer);

  var particleCount = 18;
  for (var i = 0; i < particleCount; i++) {
    var dot = document.createElement('span');
    dot.className = 'hero-particle';
    var size = Math.random() * 6 + 3;
    var left = Math.random() * 100;
    var top = Math.random() * 100;
    var delay = Math.random() * 6;
    var duration = Math.random() * 8 + 6;
    var opacity = Math.random() * 0.5 + 0.15;

    dot.style.cssText =
      'position:absolute;' +
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'left:' + left + '%;' +
      'top:' + top + '%;' +
      'background:rgba(255,255,255,' + opacity + ');' +
      'border-radius:50%;' +
      'animation:heroFloat ' + duration + 's ease-in-out ' + delay + 's infinite;' +
      'pointer-events:none;' +
      'box-shadow:0 0 ' + (size * 2) + 'px rgba(255,255,255,' + (opacity * 0.5) + ');';

    particleContainer.appendChild(dot);
  }

  for (var j = 0; j < 6; j++) {
    var line = document.createElement('span');
    line.className = 'hero-particle-line';
    var lineLeft = Math.random() * 80 + 10;
    var lineTop = Math.random() * 80 + 10;
    var lineWidth = Math.random() * 120 + 40;
    var lineAngle = Math.random() * 360;
    var lineDelay = Math.random() * 8;
    var lineDuration = Math.random() * 10 + 8;

    line.style.cssText =
      'position:absolute;' +
      'width:' + lineWidth + 'px;' +
      'height:1px;' +
      'left:' + lineLeft + '%;' +
      'top:' + lineTop + '%;' +
      'background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);' +
      'transform:rotate(' + lineAngle + 'deg);' +
      'animation:heroFloat ' + lineDuration + 's ease-in-out ' + lineDelay + 's infinite;' +
      'pointer-events:none;';

    particleContainer.appendChild(line);
  }

  if (!document.getElementById('heroFloatKeyframes')) {
    var style = document.createElement('style');
    style.id = 'heroFloatKeyframes';
    style.textContent =
      '.hero-particles{position:absolute;inset:0;overflow:hidden;z-index:1;pointer-events:none;}' +
      '@keyframes heroFloat{' +
      '0%,100%{transform:translateY(0) translateX(0);opacity:0.6;}' +
      '25%{transform:translateY(-20px) translateX(10px);opacity:1;}' +
      '50%{transform:translateY(-10px) translateX(-15px);opacity:0.7;}' +
      '75%{transform:translateY(-25px) translateX(5px);opacity:0.9;}' +
      '}';
    document.head.appendChild(style);
  }
})();
