// CRYSTALZ — main interactions
// Nav · scroll reveals · barber render · service render · booking modal · time slots · form submit

(() => {
  const D = window.CRYSTALZ_DATA;

  // ────────────── NAV ──────────────
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
  if (navToggle) {
    navToggle.addEventListener('click', () => document.body.classList.toggle('nav-mobile-open'));
  }
  // Close mobile nav on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.body.classList.remove('nav-mobile-open'));
  });

  // ────────────── SCROLL REVEALS — DISABLED ──────────────
  // Stub: keep IntersectionObserver shim so other code (counters) doesn't break, but no-op on .reveal
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });

  // ────────────── RENDER BARBERS ──────────────
  const barbersGrid = document.getElementById('barbersGrid');
  D.barbers.forEach((b, i) => {
    const card = document.createElement('article');
    card.className = 'barber-card reveal';
    card.style.transitionDelay = `${i * 80}ms`;
    const handleHtml = b.handle
      ? `<a href="${b.handleUrl}" target="_blank" rel="noopener" class="barber-handle">${b.handle}</a>`
      : `<span class="barber-handle" style="opacity:0.5;">— Crystalz Family —</span>`;
    card.innerHTML = `
      <div class="barber-image">
        ${b.badge ? `<div class="barber-badge">${b.badge}</div>` : ''}
        <img src="${b.photo}" alt="${b.name}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'gallery-placeholder',style:'width:100%;height:100%;',innerText:'${b.nick.replace(/'/g, "\\'")}'}))">
      </div>
      <div class="barber-info">
        <h3 class="barber-name">${b.nick}</h3>
        ${handleHtml}
        <p class="barber-bio">${b.bio}</p>
        <div class="barber-prices">
          <span>$${b.priceCut}</span> Cut
          <span>·</span>
          <span>$${b.priceCutBeard}</span> Cut + Beard
        </div>
        <button class="btn book-trigger" data-barber="${b.id}">Book with ${b.nick.split(' ')[0]}</button>
      </div>
    `;
    barbersGrid.appendChild(card);
    io.observe(card);
  });

  // ────────────── RENDER SERVICES ──────────────
  const servicesGrid = document.getElementById('servicesGrid');
  D.services.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'service-card reveal';
    card.style.transitionDelay = `${i * 50}ms`;
    const priceText = s.priceLow === s.priceHigh ? `$${s.priceLow}` : `$${s.priceLow}–$${s.priceHigh}`;
    card.innerHTML = `
      <div class="service-icon">${s.icon}</div>
      <div class="service-name">${s.name}</div>
      <div class="service-price">${priceText}</div>
      <div class="service-note">${s.note}</div>
    `;
    servicesGrid.appendChild(card);
    io.observe(card);
  });

  // ────────────── BOOKING MODAL ──────────────
  const modal = document.getElementById('bookingModal');
  const modalClose = document.getElementById('modalClose');
  const successClose = document.getElementById('successClose');
  const form = document.getElementById('bookingForm');
  const formSuccess = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');

  // populate barber dropdown
  const barberSel = document.getElementById('b-barber');
  D.barbers.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.nick} · ${b.locations.includes('roselle-park') ? 'Roselle Park' : 'Elizabeth'}`;
    opt.dataset.locations = b.locations.join(',');
    barberSel.appendChild(opt);
  });

  // populate service dropdown
  const serviceSel = document.getElementById('b-service');
  D.services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    const priceText = s.priceLow === s.priceHigh ? `$${s.priceLow}` : `$${s.priceLow}–$${s.priceHigh}`;
    opt.textContent = `${s.name} · ${priceText}`;
    serviceSel.appendChild(opt);
  });

  // populate date min = today, max = +60 days
  const dateInput = document.getElementById('b-date');
  const today = new Date();
  const maxDate = new Date(today.getTime() + 60 * 86400 * 1000);
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];

  // populate time slots
  const timeSel = document.getElementById('b-time');
  function rebuildTimeSlots() {
    const dayOfWeek = dateInput.value ? new Date(dateInput.value + 'T12:00').getDay() : -1;
    timeSel.innerHTML = '<option value="">— Time —</option>';
    if (dayOfWeek === -1) return;
    const loc = document.getElementById('b-location').value;
    let startHr = 10, endHr = 20;
    if (loc === 'roselle-park' && dayOfWeek === 0) {
      // RP closed Sundays
      const opt = document.createElement('option');
      opt.disabled = true; opt.textContent = '— Closed Sundays —';
      timeSel.appendChild(opt); return;
    }
    if (loc === 'roselle-park' && dayOfWeek === 6) { startHr = 9; endHr = 19; }
    if (loc === 'elizabeth' && dayOfWeek === 0) { startHr = 10; endHr = 16; }
    for (let h = startHr; h < endHr; h++) {
      for (let m = 0; m < 60; m += 30) {
        const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const display = new Date(`2000-01-01T${t}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const opt = document.createElement('option'); opt.value = t; opt.textContent = display;
        timeSel.appendChild(opt);
      }
    }
  }
  document.getElementById('b-location').addEventListener('change', rebuildTimeSlots);
  dateInput.addEventListener('change', rebuildTimeSlots);

  // open modal
  document.querySelectorAll('.book-trigger').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const preBarber = btn.dataset.barber;
      const preLocation = btn.dataset.location;
      if (preLocation) document.getElementById('b-location').value = preLocation;
      if (preBarber) {
        document.getElementById('b-barber').value = preBarber;
        const barber = D.barbers.find(b => b.id === preBarber);
        if (barber && !preLocation) {
          document.getElementById('b-location').value = barber.locations[0];
        }
      }
      rebuildTimeSlots();
      formError.classList.remove('open');
      formSuccess.classList.remove('open');
      form.style.display = '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { form.reset(); formError.classList.remove('open'); formSuccess.classList.remove('open'); form.style.display = ''; }, 300);
  }
  modalClose.addEventListener('click', closeModal);
  successClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  // ────────────── BOOKING SUBMIT ──────────────
  // Booking endpoint — Cloudflare Worker (or fallback). Set this to deployed Worker URL.
  const BOOKING_ENDPOINT = '/api/book';  // Update after deploying api/booking-worker.js

  form.addEventListener('submit', async e => {
    e.preventDefault();
    formError.classList.remove('open');
    submitBtn.disabled = true; submitBtn.textContent = 'Confirming…';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    const barber = D.barbers.find(b => b.id === data.barber);
    const service = D.services.find(s => s.id === data.service);
    const location = D.locations[data.location];
    const payload = {
      ...data,
      barberName: barber ? barber.nick : '',
      barberFullName: barber ? barber.name : '',
      serviceName: service ? service.name : '',
      servicePrice: service ? `$${service.priceLow}–$${service.priceHigh}` : '',
      locationLabel: location ? location.label : '',
      locationAddress: location ? location.address : '',
      locationPhone: location ? location.phoneDisplay : '',
      datetime: `${data.date}T${data.time}:00`,
      siteUrl: window.location.origin
    };

    try {
      const res = await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || 'Booking failed');
      }
      // Show success
      form.style.display = 'none';
      formSuccess.classList.add('open');
    } catch (err) {
      console.error(err);
      formError.textContent = `Couldn't confirm: ${err.message}. Please call ${payload.locationPhone || '(908) 259-1151'} to book.`;
      formError.classList.add('open');
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = 'Confirm Appointment';
    }
  });

  // ────────────── MAGNETIC BUTTONS ──────────────
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', e => {
      // Re-find dynamically-added buttons each time
    });
    document.addEventListener('mousemove', (e) => {
      document.querySelectorAll('.btn').forEach(btn => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(r.width, r.height) * 1.2;
        if (dist < radius) {
          // Subtler magnetic pull — was 0.2/0.3, now 0.08/0.08
          btn.style.transform = `translate(${dx * 0.08}px, ${dy * 0.08}px)`;
        } else if (btn.style.transform) {
          btn.style.transform = '';
        }
      });
    });
  }

  // ────────────── STAT COUNTER ──────────────
  const statCounters = document.querySelectorAll('.stat-number');
  const co = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting || e.target.dataset.done) return;
      const el = e.target;
      const raw = el.textContent.trim();
      const target = parseInt(raw, 10);
      if (isNaN(target)) return;
      const suffix = raw.replace(/[0-9]/g, '');
      const dur = 1400; const start = performance.now();
      el.dataset.done = '1';
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  statCounters.forEach(c => co.observe(c));

  // ────────────── HERO PARALLAX (subtle) ──────────────
  const hero = document.querySelector('.hero-content');
  if (hero && window.matchMedia('(min-width: 900px)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        hero.style.transform = `translateY(${y * 0.15}px)`;
        hero.style.opacity = String(1 - y / (window.innerHeight * 0.9));
      }
    }, { passive: true });
  }

  // ────────────── HERO PATTERN PARALLAX (scroll-driven) ──────────────
  const heroPattern = document.querySelector('.hero-pattern');
  const heroEl = document.querySelector('.hero');
  if (heroPattern && heroEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const updatePattern = () => {
      const heroHeight = heroEl.offsetHeight || window.innerHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / heroHeight, 1);
      const translateY = scrolled * 0.4;          // background lags behind content
      const scale = 1 + progress * 0.08;          // subtle zoom-in
      const opacity = 0.55 - progress * 0.40;     // fade as user scrolls past (0.55 → 0.15)
      heroPattern.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      heroPattern.style.opacity = opacity.toFixed(3);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updatePattern); ticking = true; }
    }, { passive: true });
    updatePattern();
  }
})();
