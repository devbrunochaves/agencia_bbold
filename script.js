/* ═══════════════════════════════════════════════════════════
   AGÊNCIA BBOLD — script.js
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── NAV: scroll sticky + hamburger ──────────────────────
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ─── REVEAL ON SCROLL ─────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // ─── COUNTER ANIMATION ────────────────────────────────────
  function animateCounter(el, target, duration = 1600) {
    let start = 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.numbers__value').forEach(el => {
    counterObserver.observe(el);
  });

  // ─── SMOOTH ANCHOR SCROLL ─────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = nav.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ─── CONTACT FORM ─────────────────────────────────────────
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = form.querySelector('#name').value.trim();
      const phone = form.querySelector('#phone').value.trim();
      const company = form.querySelector('#company').value.trim();
      const service = form.querySelector('#service').value;
      const message = form.querySelector('#message').value.trim();

      if (!name || !phone) {
        showToast('Preencha seu nome e WhatsApp. 😊', 'error');
        return;
      }

      // Build WhatsApp message
      const text = encodeURIComponent(
        `Olá! Vim pelo site da Agência BBold.\n\n` +
        `*Nome:* ${name}\n` +
        (company ? `*Empresa:* ${company}\n` : '') +
        (service ? `*Serviço de interesse:* ${service}\n` : '') +
        (message ? `*Mensagem:* ${message}\n` : '')
      );

      // Open WhatsApp
      window.open(`https://wa.me/5527997341557?text=${text}`, '_blank');
      showToast('Redirecionando para o WhatsApp! 🚀', 'success');
      form.reset();
    });
  }

  // ─── TOAST NOTIFICATION ───────────────────────────────────
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      background: type === 'success' ? '#F5C518' : '#e74c3c',
      color: type === 'success' ? '#0A0A0A' : '#fff',
      padding: '14px 24px',
      borderRadius: '4px',
      fontFamily: "'Barlow', sans-serif",
      fontWeight: '700',
      fontSize: '0.9rem',
      zIndex: '9999',
      boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      transform: 'translateY(80px)',
      opacity: '0',
      transition: 'transform 0.35s ease, opacity 0.35s ease',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(80px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ─── SERVICE CARDS: stagger on scroll ─────────────────────
  const serviceCards = document.querySelectorAll('.service-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || 0) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  serviceCards.forEach(card => cardObserver.observe(card));

  // ─── HOW STEPS: hover parallax tilt ───────────────────────
  document.querySelectorAll('.how-step').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      card.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ─── MARQUEE TICKER: skills in hero area ──────────────────
  // Subtle ambient effect — yellow dot cursor
  const cursor = document.createElement('div');
  cursor.style.cssText = `
    position: fixed; width: 12px; height: 12px;
    background: #F5C518; border-radius: 50%; pointer-events: none;
    z-index: 9999; transform: translate(-50%, -50%);
    transition: transform 0.15s ease, opacity 0.15s ease;
    opacity: 0; mix-blend-mode: difference;
  `;
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.style.opacity = '1';
  });

  document.querySelectorAll('a, button, .service-card, .how-step').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(3)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });

  // ─── PAGE LOAD: hero entrance stagger ─────────────────────
  const heroEls = document.querySelectorAll('.hero .reveal');
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 200 + i * 120);
  });

  console.log('%cAgência BBold 🟡', 'font-size:20px;font-weight:bold;color:#F5C518;background:#0A0A0A;padding:8px 16px;border-radius:4px;');
  console.log('%cDesenvolvido por Bruno Chaves | brunochavesuk@icloud.com', 'font-size:12px;color:#888;');
});
