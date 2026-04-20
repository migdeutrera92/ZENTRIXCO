// ===== Mobile Navigation Toggle =====
const mobileToggle = document.getElementById('mobileToggle');
const nav = document.getElementById('nav');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    mobileToggle.classList.toggle('active');
  });
}

// Close mobile menu when clicking a nav link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    if (mobileToggle) mobileToggle.classList.remove('active');
  });
});

// ===== Active Navigation Link on Scroll =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
  const scrollY = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveNav);

// ===== Header Shadow on Scroll =====
const header = document.getElementById('header');

function updateHeader() {
  if (window.scrollY > 50) {
    header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.12)';
  } else {
    header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
  }
}

window.addEventListener('scroll', updateHeader);

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!firstName || !lastName || !email || !message) {
      showNotification('Please fill in all fields.', 'error');
      return;
    }

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      showNotification('Message sent successfully! We will get back to you soon.', 'success');
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });
}

// ===== Notification System =====
function showNotification(message, type) {
  // Remove existing notification
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

  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
    }
  }, 4000);
}

// ===== Service Card Click Interaction =====
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

// ===== Smooth Scroll for all anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      const headerHeight = document.getElementById('header').offsetHeight;
      const targetPosition = target.offsetTop - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});