import './styles-global.css';

// ===== Mobile Navigation Toggle =====
const mobileToggle = document.getElementById('mobileToggle');
const nav = document.getElementById('nav');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    mobileToggle.classList.toggle('active');
  });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    if (mobileToggle) mobileToggle.classList.remove('active');
  });
});

// ===== Header Shadow on Scroll =====
const header = document.getElementById('header');

function updateHeader() {
  if (!header) return;
  if (window.scrollY > 50) {
    header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.12)';
  } else {
    header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
  }
}

window.addEventListener('scroll', updateHeader);

// ===== Scroll Reveal Animation =====
function revealOnScroll() {
  const elements = document.querySelectorAll('.reveal');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('revealed');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// ===== Number Counter Animation =====
// Counter animation is handled by counter-animation.js (loaded as non-module script for reliability)

// ===== Servicios Page - Scroll Animations =====
(function () {
  function initSvcAnimations() {
    var svcCards = document.querySelectorAll('.svc-card');
    var svcSections = document.querySelectorAll('.svc-section');
    var processSteps = document.querySelectorAll('.process-step');

    if (svcCards.length === 0 && svcSections.length === 0 && processSteps.length === 0) return;

    var allElements = [];
    svcCards.forEach(function (el) { allElements.push(el); });
    svcSections.forEach(function (el) { allElements.push(el); });
    processSteps.forEach(function (el) { allElements.push(el); });

    // First, ensure all elements are visible (no hidden state)
    allElements.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.classList.remove('will-animate');
      el.classList.add('animate-in');
    });

    if ('IntersectionObserver' in window) {
      // Only apply scroll animation to elements below the fold
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
        if (el.classList.contains('will-animate')) {
          svcObserver.observe(el);
        }
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

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    setTimeout(() => {
      showNotification('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', 'success');
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });
}

// ===== Notification System =====
function showNotification(message, type) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
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
      : 'linear-gradient(135deg, #dc3545, #e8652e)',
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
    }
  }, 4000);
}

// ===== Industry Tabs =====
document.querySelectorAll('.industry-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.industry-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.dataset.target;
    document.querySelectorAll('.industry-panel').forEach(panel => {
      panel.style.display = 'none';
    });
    const targetPanel = document.getElementById(target);
    if (targetPanel) targetPanel.style.display = 'block';
  });
});

// ===== ROI Calculator =====
function updateCalculator() {
  const employees = document.getElementById('calcEmployees');
  const hours = document.getElementById('calcHours');
  const cost = document.getElementById('calcCost');

  if (!employees || !hours || !cost) return;

  const empVal = parseInt(employees.value) || 0;
  const hoursVal = parseInt(hours.value) || 0;
  const costVal = parseInt(cost.value) || 0;

  document.getElementById('empValue').textContent = empVal;
  document.getElementById('hoursValue').textContent = hoursVal + 'h';
  document.getElementById('costValue').textContent = '$' + costVal;

  const monthlySaving = empVal * hoursVal * (costVal / 160) * 0.7;
  const annualSaving = monthlySaving * 12;

  const resultEl = document.getElementById('calcResultValue');
  if (resultEl) {
    resultEl.textContent = '$' + Math.round(annualSaving).toLocaleString() + ' USD/año';
  }
}

// Initialize calculator if present
window.addEventListener('load', () => {
  if (document.getElementById('calcEmployees')) {
    updateCalculator();
  }
});

// ===== Smooth Scroll for all anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      const headerHeight = document.getElementById('header') ? document.getElementById('header').offsetHeight : 0;
      const targetPosition = target.offsetTop - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  });
});

// ===== Floating Atom Particles for Page Hero =====
(function () {
  var hero = document.querySelector('.page-hero');
  if (!hero) return;

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