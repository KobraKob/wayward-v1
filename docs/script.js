/* ============================
   PARTICLE CANVAS
   ============================ */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.4 + 0.1;
    const colors = ['255,107,53', '0,212,170', '124,92,252', '255,184,0'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (mouse.x !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x -= (dx / dist) * force * 0.8;
        this.y -= (dy / dist) * force * 0.8;
      }
    }

    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
    ctx.fill();
  }
}

function initParticles() {
  const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const opacity = (1 - dist / 150) * 0.08;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(255,107,53,${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
window.addEventListener('resize', initParticles);

/* ============================
   NAVBAR SCROLL
   ============================ */
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  navbar.classList.toggle('scrolled', scrollY > 50);
  lastScroll = scrollY;
});

/* ============================
   MOBILE NAV TOGGLE
   ============================ */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ============================
   SCROLL REVEAL
   ============================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, idx) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('revealed');

        // Handle rank bar fills
        if (entry.target.classList.contains('rank-card')) {
          const fill = entry.target.querySelector('.rank-fill');
          if (fill) {
            const w = fill.style.width;
            fill.style.setProperty('--target-width', w);
            fill.style.width = w;
          }
        }
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => {
  revealObserver.observe(el);
});

/* ============================
   COUNTER ANIMATION
   ============================ */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current);
      }, 30);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => {
  counterObserver.observe(el);
});

/* ============================
   PHONE SCREEN ROTATION
   ============================ */
const screens = ['screen-home', 'screen-quest', 'screen-social'];
let currentScreen = 0;

function rotateScreen() {
  const current = document.getElementById(screens[currentScreen]);
  current.classList.add('exit-left');
  current.classList.remove('active');

  currentScreen = (currentScreen + 1) % screens.length;
  const next = document.getElementById(screens[currentScreen]);

  setTimeout(() => {
    current.classList.remove('exit-left');
    next.classList.add('active');
  }, 400);
}

setInterval(rotateScreen, 4000);

/* ============================
   EMOJI REACTION CLICK
   ============================ */
document.querySelectorAll('.bp-reaction').forEach(btn => {
  btn.addEventListener('click', () => {
    let count = parseInt(btn.dataset.count);
    btn.classList.toggle('reacted');
    if (btn.classList.contains('reacted')) {
      count++;
      btn.style.background = 'rgba(255, 107, 53, 0.15)';
      btn.style.borderColor = 'rgba(255, 107, 53, 0.3)';
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => btn.style.transform = 'scale(1.05)', 200);
    } else {
      count--;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.transform = '';
    }
    btn.dataset.count = count;
  });
});

/* ============================
   ADVENTURE CLOCK TIMER
   ============================ */
const timerEl = document.querySelector('.timer-text');
if (timerEl) {
  let seconds = 5025; // 1:23:45
  setInterval(() => {
    seconds++;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* ============================
   SMOOTH SCROLL FOR ANCHORS
   ============================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = navbar.offsetHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================
   DOWNLOAD BUTTON RIPPLE
   ============================ */
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
  downloadBtn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      width: 100px;
      height: 100px;
      transform: translate(-50%, -50%) scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    const rect = this.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // Add ripple keyframes
  const style = document.createElement('style');
  style.textContent = `@keyframes ripple { to { transform: translate(-50%, -50%) scale(4); opacity: 0; } }`;
  document.head.appendChild(style);
}

/* ============================
   TILT EFFECT ON FEATURE CARDS
   ============================ */
document.querySelectorAll('.feature-card, .diff-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ============================
   CATEGORY PILL HOVER GLOW
   ============================ */
document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('mouseenter', () => {
    pill.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.15)';
  });
  pill.addEventListener('mouseleave', () => {
    pill.style.boxShadow = '';
  });
});
