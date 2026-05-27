/* FADIZ Agency — main.js */
(function () {
  'use strict';

  /* ── Mobile Nav ─────────────────────────────────────────────────────────── */
  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (!toggle || !drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    if (overlay) overlay.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ── Modal ───────────────────────────────────────────────────────────────── */
  function initModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;

    function openModal() {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-modal-open]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); openModal(); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    const form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        handleFormSubmit(form, closeModal);
      });
    }
  }

  /* ── Sticky Header ────────────────────────────────────────────────────────── */
  function initStickyHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const threshold = 60;
    let ticking = false;

    function update() {
      if (window.scrollY > threshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── Animated Counters ───────────────────────────────────────────────────── */
  function initCounters() {
    const elements = document.querySelectorAll('[data-counter]');
    if (!elements.length) return;

    function animateCount(el) {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1800;
      const start = performance.now();
      const isFloat = target % 1 !== 0;

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    elements.forEach(el => observer.observe(el));
  }

  /* ── Smooth Scroll ────────────────────────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const headerH = document.getElementById('header')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── Active Nav ───────────────────────────────────────────────────────────── */
  function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, #mobile-drawer a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const page = href.split('/').pop().split('#')[0] || 'index.html';
      if (page === current) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ── Auto-scroll Iframes ──────────────────────────────────────────────────── */
  function initAutoScrollIframes() {
    const cards = document.querySelectorAll('.iframe-card');
    if (!cards.length) return;

    cards.forEach(card => {
      const wrap = card.querySelector('.iframe-wrap');
      const iframe = card.querySelector('iframe');
      if (!wrap || !iframe) return;

      let scrollY = 0;
      let animId = null;
      let paused = false;
      const speed = 0.4;

      function tick() {
        if (!paused) {
          scrollY += speed;
          const max = iframe.scrollHeight - wrap.clientHeight;
          if (scrollY > (max > 0 ? max : 3000)) scrollY = 0;
          try { iframe.contentWindow.scrollTo(0, scrollY); } catch (_) {}
        }
        animId = requestAnimationFrame(tick);
      }

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            paused = false;
            if (!animId) tick();
          } else {
            paused = true;
          }
        });
      }, { threshold: 0.1 });
      io.observe(card);

      card.addEventListener('mouseenter', () => { paused = true; });
      card.addEventListener('mouseleave', () => { paused = false; });
    });
  }

  /* ── Lightbox ─────────────────────────────────────────────────────────────── */
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('#lb-img');
    const caption = lightbox.querySelector('#lb-caption');
    const btnClose = lightbox.querySelector('#lb-close');
    const btnPrev = lightbox.querySelector('#lb-prev');
    const btnNext = lightbox.querySelector('#lb-next');

    let items = [];
    let current = 0;

    function openLightbox(index) {
      current = index;
      show(current);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    function show(i) {
      const item = items[i];
      if (!item || !img) return;
      img.src = item.src;
      img.alt = item.alt || '';
      if (caption) caption.textContent = item.caption || item.alt || '';
    }
    function prev() { current = (current - 1 + items.length) % items.length; show(current); }
    function next() { current = (current + 1) % items.length; show(current); }

    document.querySelectorAll('[data-lightbox]').forEach((el, i) => {
      const src = el.dataset.lightbox || el.src || el.querySelector('img')?.src;
      const alt = el.dataset.caption || el.alt || el.querySelector('img')?.alt || '';
      const caption = el.dataset.caption || alt;
      items.push({ src, alt, caption });
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', e => { e.preventDefault(); openLightbox(i); });
    });

    if (btnClose) btnClose.addEventListener('click', closeLightbox);
    if (btnPrev) btnPrev.addEventListener('click', prev);
    if (btnNext) btnNext.addEventListener('click', next);

    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  /* ── ROI Calculator ────────────────────────────────────────────────────────── */
  function initROICalculator() {
    const section = document.getElementById('roi-calc');
    if (!section) return;

    const budgetSlider = section.querySelector('#roi-budget');
    const budgetDisplay = section.querySelector('#roi-budget-val');
    const sectorSelect = section.querySelector('#roi-sector');
    const leadsEl = section.querySelector('#roi-leads');
    const cplEl = section.querySelector('#roi-cpl');
    const caEl = section.querySelector('#roi-ca');
    const roiEl = section.querySelector('#roi-percent');

    const sectorData = {
      ecommerce:  { cr: 0.025, aov: 1200,  cpc: 4.5 },
      immobilier: { cr: 0.018, aov: 15000, cpc: 8.0 },
      restauration: { cr: 0.04, aov: 350,  cpc: 2.5 },
      sante:      { cr: 0.022, aov: 800,   cpc: 5.5 },
      education:  { cr: 0.03,  aov: 2500,  cpc: 3.5 },
      btp:        { cr: 0.015, aov: 25000, cpc: 7.0 },
      default:    { cr: 0.025, aov: 1500,  cpc: 5.0 },
    };

    function compute() {
      const budget = parseInt(budgetSlider?.value || 5000);
      const sector = sectorSelect?.value || 'default';
      const d = sectorData[sector] || sectorData.default;

      const clicks = Math.round(budget / d.cpc);
      const leads = Math.round(clicks * d.cr);
      const cpl = leads > 0 ? Math.round(budget / leads) : 0;
      const ca = Math.round(leads * d.aov * 0.2);
      const roi = budget > 0 ? Math.round(((ca - budget) / budget) * 100) : 0;

      if (budgetDisplay) budgetDisplay.textContent = budget.toLocaleString('fr-FR') + ' MAD';
      if (leadsEl) leadsEl.textContent = leads;
      if (cplEl) cplEl.textContent = cpl + ' MAD';
      if (caEl) caEl.textContent = ca.toLocaleString('fr-FR') + ' MAD';
      if (roiEl) roiEl.textContent = (roi > 0 ? '+' : '') + roi + '%';
      if (roiEl) roiEl.style.color = roi >= 0 ? 'var(--green)' : '#e74c3c';
    }

    if (budgetSlider) budgetSlider.addEventListener('input', compute);
    if (sectorSelect) sectorSelect.addEventListener('change', compute);
    compute();
  }

  /* ── Devis Calculator ─────────────────────────────────────────────────────── */
  function initDevisCalculator() {
    const form = document.getElementById('devis-calc');
    if (!form) return;

    const result = document.getElementById('devis-result');

    const prices = {
      web:  { vitrine: 4900, ecommerce: 12000, app: 25000 },
      ads:  { starter: 1500, growth: 3500, pro: 7000 },
      seo:  { local: 1200, national: 2500, international: 5000 },
      erp:  { base: 8000, advanced: 18000, custom: 35000 },
    };

    function compute() {
      let total = 0;
      form.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked, select').forEach(el => {
        const val = el.value;
        const cat = el.dataset.cat;
        if (cat && prices[cat] && prices[cat][val]) {
          total += prices[cat][val];
        }
      });
      if (result) {
        result.textContent = total > 0
          ? 'Estimation : à partir de ' + total.toLocaleString('fr-FR') + ' MAD'
          : 'Sélectionnez vos besoins ci-dessus';
      }
    }

    form.querySelectorAll('input, select').forEach(el => el.addEventListener('change', compute));
    compute();
  }

  /* ── Accordion ────────────────────────────────────────────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        if (!item) return;
        const isOpen = item.classList.contains('open');
        const parent = item.closest('.accordion');
        if (parent) {
          parent.querySelectorAll('.accordion-item.open').forEach(open => {
            if (open !== item) open.classList.remove('open');
          });
        }
        item.classList.toggle('open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  /* ── Filter Bar (Portfolio) ───────────────────────────────────────────────── */
  function initFilterBar() {
    const bar = document.querySelector('.filter-bar');
    if (!bar) return;

    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        document.querySelectorAll('[data-category]').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.classList.remove('hidden');
          } else {
            item.style.display = 'none';
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ── Ticker ───────────────────────────────────────────────────────────────── */
  function initTicker() {
    const ticker = document.querySelector('.ticker-track');
    if (!ticker) return;
    const clone = ticker.cloneNode(true);
    ticker.parentElement.appendChild(clone);
  }

  /* ── Tab Switcher ─────────────────────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(tabs => {
      const buttons = tabs.querySelectorAll('[data-tab]');
      const panels = tabs.querySelectorAll('[data-panel]');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const panelId = btn.dataset.tab;
          const panel = tabs.querySelector('[data-panel="' + panelId + '"]');
          if (panel) panel.classList.add('active');
        });
      });
    });
  }

  /* ── Form Submit Handler ─────────────────────────────────────────────────── */
  function handleFormSubmit(form, callback) {
    const btn = form.querySelector('[type=submit]');
    const original = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
    }

    const data = new FormData(form);
    const body = {};
    data.forEach((v, k) => { body[k] = v; });

    setTimeout(() => {
      form.innerHTML = '<div class="form-success"><i class="fa-solid fa-circle-check"></i><p>Merci ! Nous vous recontactons sous 24h.</p></div>';
      if (typeof callback === 'function') setTimeout(callback, 2200);
    }, 1200);
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      handleFormSubmit(form, null);
    });
  }

  /* ── Scroll Reveal (lightweight) ─────────────────────────────────────────── */
  function initScrollReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
  }

  /* ── Video Modal ──────────────────────────────────────────────────────────── */
  function initVideoModal() {
    document.querySelectorAll('[data-video]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const src = btn.dataset.video;
        const existing = document.getElementById('video-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'video-modal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<div style="position:relative;width:min(90vw,900px);aspect-ratio:16/9;"><iframe src="' + src + '?autoplay=1" style="width:100%;height:100%;border:0;border-radius:12px;" allow="autoplay;fullscreen" allowfullscreen></iframe><button style="position:absolute;top:-2.5rem;right:0;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;" aria-label="Fermer">&times;</button></div>';
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        overlay.querySelector('button').addEventListener('click', () => {
          overlay.remove();
          document.body.style.overflow = '';
        });
        overlay.addEventListener('click', e => {
          if (e.target === overlay) { overlay.remove(); document.body.style.overflow = ''; }
        });
      });
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────────────── */
  function init() {
    initMobileNav();
    initModal();
    initStickyHeader();
    initCounters();
    initSmoothScroll();
    initActiveNav();
    initAutoScrollIframes();
    initLightbox();
    initROICalculator();
    initDevisCalculator();
    initAccordion();
    initFilterBar();
    initTicker();
    initTabs();
    initContactForm();
    initScrollReveal();
    initVideoModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
