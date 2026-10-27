/* ==========================================================================
   Liquid Studio — interactions
   Vanilla JS, no dependencies. Every feature degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Content — edit these to make the template your own
     ------------------------------------------------------------------ */
  var SERVICES = [
    { label: 'Websites', short: 'a website', num: 'Service 01', tint: ['#4b35d6', '#2fa6d8'],
      desc: 'A complete multi-page site for your business, from the first sketch to a live link you can share.',
      items: ['Custom design for every page', 'Works on phones, tablets and laptops', 'Contact form that sends leads to you', 'WhatsApp button for quick questions', 'Free hosting setup'] },
    { label: 'Landing pages', short: 'a landing page', num: 'Service 02', tint: ['#d0479a', '#4b35d6'],
      desc: 'One page, one offer, one clear next step. Built for launches, ads and lead forms.',
      items: ['One focused page with a single goal', 'Fast loading on mobile data', 'Lead form or WhatsApp button', 'Copy structured around one action', 'Ready for Meta and Google ads'] },
    { label: 'UI/UX', short: 'UI/UX design', num: 'Service 03', tint: ['#1f9e7a', '#4b35d6'],
      desc: 'App and dashboard screens with clear flows, ready for a developer to build.',
      items: ['User flow mapped before screens', 'Clickable prototype to test', 'Mobile and desktop screens', 'Reusable components and styles', 'Developer-ready handoff'] }
  ];

  var BUSINESSES = [
    { label: 'Restaurant', name: 'Saffron Table', nav1: 'Menu', nav2: 'Reservations', tagline: 'Slow-cooked karahi, made to share.', sub: 'Open daily from 12 to 12. Walk in or reserve a table.', cta: 'Reserve a table',
      items: [['Chicken karahi', 'Rs 1,850'], ['Seekh kebab', 'Rs 950'], ['Kheer', 'Rs 450']] },
    { label: 'Salon', name: 'Velvet & Co', nav1: 'Services', nav2: 'Stylists', tagline: 'Cuts, colour and an hour of calm.', sub: 'Appointments seven days a week.', cta: 'Book an appointment',
      items: [['Haircut & style', 'Rs 2,500'], ['Hair colour', 'Rs 6,000'], ['Facial', 'Rs 3,500']] },
    { label: 'Gym', name: 'Ironline', nav1: 'Membership', nav2: 'Coaches', tagline: 'Train with intent. Track every rep.', sub: 'Open 6am to midnight with coaches on the floor.', cta: 'Start a free trial',
      items: [['Monthly', 'Rs 6,000'], ['Quarterly', 'Rs 16,000'], ['Personal training', 'Rs 15,000']] },
    { label: 'Bakery', name: 'Crumb House', nav1: 'Cakes', nav2: 'Order', tagline: 'Baked at six. Gone by evening.', sub: 'Fresh breads, custom cakes and next-day delivery.', cta: 'Order a cake',
      items: [['Sourdough loaf', 'Rs 900'], ['Chocolate cake', 'Rs 3,200'], ['Croissant box', 'Rs 1,400']] }
  ];

  /* Re-enable transitions after the first paint (see theme-init.js) */
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('no-anim'); }); });

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ------------------------------------------------------------------
     Theme switch (light / dark), remembered per visitor
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var themeBtn = $('.theme-switch');
  function syncThemeButton() {
    if (themeBtn) themeBtn.setAttribute('aria-checked', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
  }
  syncThemeButton();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      syncThemeButton();
    });
  }

  /* ------------------------------------------------------------------
     Liquid lens segmented controls (services, business type, tab bar)
     ------------------------------------------------------------------ */
  function LiquidSeg(el, onChange) {
    this.el = el;
    this.lens = $('.lens', el);
    this.items = $$('.seg-btn', el);
    this.flip = false;
    this.index = Math.max(0, this.items.findIndex(function (b) {
      return b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-current') === 'true';
    }));
    this.onChange = onChange;
    el.style.setProperty('--i', this.index);
    var self = this;
    this.items.forEach(function (btn, i) {
      btn.addEventListener('click', function () { self.select(i, true); });
    });
    // Drag the lens with a mouse or finger; release to snap to the nearest option
    var drag = null;
    var pad = parseFloat(getComputedStyle($('.seg-track', el)).left) || 5;
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { x0: e.clientX, id: e.pointerId, moved: false, x: 0, w: 1 };
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x0) < 6) return;
        drag.moved = true;
        try { el.setPointerCapture(drag.id); } catch (err) { /* ignore */ }
        self.lens.classList.remove('pop-a', 'pop-b', 'drop-a', 'drop-b');
        self.lens.classList.add('dragging');
      }
      var r = el.getBoundingClientRect();
      var n = self.items.length;
      drag.w = (r.width - pad * 2) / n;
      drag.x = Math.max(0, Math.min(e.clientX - r.left - pad - drag.w / 2, (n - 1) * drag.w));
      self.lens.style.left = drag.x + 'px';
    });
    function endDrag() {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.moved) return;
      var i = Math.max(0, Math.min(self.items.length - 1, Math.round(d.x / d.w)));
      self.lens.classList.remove('dragging');
      self.dropFlip = !self.dropFlip;
      self.lens.classList.add(self.dropFlip ? 'drop-a' : 'drop-b');
      // let the browser register the pixel position before handing back to the CSS slot position
      requestAnimationFrame(function () { self.lens.style.left = ''; });
      self.suppressClick = true;
      setTimeout(function () { self.suppressClick = false; }, 0);
      self.select(i, false, true);
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('click', function (e) {
      if (self.suppressClick) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // Arrow-key support for tab lists
    if (el.getAttribute('role') === 'tablist') {
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = self.items.length;
        var next = (self.index + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
        self.select(next, true);
        self.items[next].focus();
        e.preventDefault();
      });
    }
  }
  LiquidSeg.prototype.select = function (i, animate, fromDrag) {
    if (fromDrag && this.onDrop) this.onDrop(i);
    if (i === this.index) return;
    this.index = i;
    this.el.style.setProperty('--i', i);
    var isTab = this.items[0] && this.items[0].tagName === 'BUTTON';
    this.items.forEach(function (b, k) {
      if (isTab) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; }
      else if (k === i) { b.setAttribute('aria-current', 'true'); } else { b.removeAttribute('aria-current'); }
      b.classList.remove('mag-a', 'mag-b');
    });
    if (animate && !reduceMotion) {
      this.flip = !this.flip;
      var a = this.flip ? 'a' : 'b';
      this.lens.classList.remove('pop-a', 'pop-b', 'drop-a', 'drop-b');
      this.lens.classList.add('pop-' + a);
      this.items[i].classList.add('mag-' + a);
    }
    if (this.onChange) this.onChange(i);
  };

  /* ------------------------------------------------------------------
     Services
     ------------------------------------------------------------------ */
  var svcCard = $('.service-card');
  function renderService(i) {
    var s = SERVICES[i];
    if (!s || !svcCard) return;
    $('[data-svc="num"]').textContent = s.num;
    $('[data-svc="label"]').textContent = s.label;
    $('[data-svc="desc"]').textContent = s.desc;
    $('[data-svc="short"]').textContent = s.short;
    var ul = $('[data-svc="items"]');
    ul.textContent = '';
    s.items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    svcCard.style.setProperty('--svc1', s.tint[0]);
    svcCard.style.setProperty('--svc2', s.tint[1]);
  }
  var svcSeg = $('[data-seg="services"]');
  if (svcSeg) new LiquidSeg(svcSeg, renderService);

  /* ------------------------------------------------------------------
     Live preview: business type + accent colour
     ------------------------------------------------------------------ */
  var sample = $('.sample');
  function renderBusiness(i) {
    var b = BUSINESSES[i];
    if (!b || !sample) return;
    ['name', 'nav1', 'nav2', 'label', 'tagline', 'sub', 'cta'].forEach(function (k) {
      var el = $('[data-biz="' + k + '"]', sample);
      if (el) el.textContent = b[k];
    });
    var list = $('[data-biz="items"]', sample);
    list.textContent = '';
    b.items.forEach(function (row) {
      var r = document.createElement('div'); r.className = 'sample-row';
      var a = document.createElement('span'); a.textContent = row[0];
      var p = document.createElement('span'); p.textContent = row[1];
      r.appendChild(a); r.appendChild(p); list.appendChild(r);
    });
  }
  renderBusiness(0);
  var bizSeg = $('[data-seg="biz"]');
  if (bizSeg) new LiquidSeg(bizSeg, renderBusiness);

  $$('.swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      $$('.swatch').forEach(function (o) { o.setAttribute('aria-pressed', o === sw ? 'true' : 'false'); });
      var cs = sw.style;
      sample.style.setProperty('--ac', cs.getPropertyValue('--c'));
      sample.style.setProperty('--ac-soft', cs.getPropertyValue('--soft'));
    });
  });

  /* ------------------------------------------------------------------
     "Type your business name" live binding
     ------------------------------------------------------------------ */
  var input = $('#biz-name');
  function renderName() {
    var raw = (input && input.value || '').trim();
    var name = raw || 'Your Business';
    var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourbusiness';
    $$('[data-bind="name"]').forEach(function (el) { el.textContent = name; });
    $$('[data-bind="upper"]').forEach(function (el) { el.textContent = name.toUpperCase(); });
    $$('[data-bind="domain"]').forEach(function (el) { el.textContent = slug + '.com'; });
    $$('[data-bind="cta"]').forEach(function (el) { el.textContent = raw ? name : 'your project'; });
  }
  if (input) input.addEventListener('input', renderName);

  /* ------------------------------------------------------------------
     Spotlight + 3D tilt (mouse only — skipped on touch for smooth scrolling)
     ------------------------------------------------------------------ */
  var wrap = $('[data-spotlight]');
  var browser = $('[data-tilt]');
  if (wrap && !reduceMotion) {
    var raf = 0, px = 0, py = 0;
    wrap.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = wrap.getBoundingClientRect();
        var x = px - r.left, y = py - r.top;
        wrap.style.setProperty('--sx', (x - 320) + 'px');
        wrap.style.setProperty('--sy', (y - 320) + 'px');
        if (browser) {
          browser.style.setProperty('--rx', ((y / r.height - 0.5) * -6).toFixed(2) + 'deg');
          browser.style.setProperty('--ry', ((x / r.width - 0.5) * 8).toFixed(2) + 'deg');
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Bottom tab bar: click to jump, scroll-spy to follow
     ------------------------------------------------------------------ */
  var navEl = $('[data-seg="nav"]');
  if (navEl) {
    var navSeg = new LiquidSeg(navEl, null);
    var ids = navSeg.items.map(function (a) { return a.getAttribute('href').slice(1); });
    var lockUntil = 0;
    // Dropping the lens on a tab scrolls to that section (a drag doesn't trigger the link)
    navSeg.onDrop = function (i) {
      lockUntil = Date.now() + 900;
      var target = document.getElementById(ids[i]);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    navSeg.items.forEach(function (a) { a.addEventListener('click', function () { lockUntil = Date.now() + 900; }); });
    var sraf = 0;
    window.addEventListener('scroll', function () {
      if (sraf) return;
      sraf = requestAnimationFrame(function () {
        sraf = 0;
        if (Date.now() < lockUntil) return;
        var mid = window.innerHeight * 0.4, cur = 0;
        ids.forEach(function (id, i) {
          var el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= mid) cur = i;
        });
        navSeg.select(cur, false);
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     FAQ accordion (one open at a time)
     ------------------------------------------------------------------ */
  $$('.faq-item').forEach(function (item) {
    var btn = $('.faq-q', item);
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('open');
      $$('.faq-item').forEach(function (o) {
        o.classList.remove('open');
        $('.faq-q', o).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
})();
