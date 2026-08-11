/**
 * jelita.kanatang — script.js
 * Combined JS: Tailwind Config + New Hero Slider + All Old Interactions
 * =====================================================
 */

/* ─── TAILWIND CONFIGURATION ─── */
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
};

/* ─── UI LOGIC ─── */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ─── 1. STICKY HEADER (glassmorphism state) ─── */
  const header = document.getElementById('site-header');

  function onScroll() {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ─── 2. HAMBURGER / MOBILE NAV ─── */
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav    = document.getElementById('mobile-nav');
  const hb1 = document.getElementById('hb-1');
  const hb2 = document.getElementById('hb-2');
  const hb3 = document.getElementById('hb-3');

  function toggleMenu(force) {
    if (!mobileNav || !hamburgerBtn) return;
    const open = typeof force === 'boolean' ? force : !mobileNav.classList.contains('open');
    mobileNav.classList.toggle('open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    hamburgerBtn.setAttribute('aria-expanded', String(open));
    hb1.style.transform = open ? 'rotate(45deg) translate(3px,3px)'  : '';
    hb2.style.opacity   = open ? '0' : '';
    hb3.style.transform = open ? 'rotate(-45deg) translate(3px,-3px)' : '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => toggleMenu());
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => toggleMenu(false))
    );
  }

  /* ─── 3. SMOOTH SCROLL (respects fixed header height) ─── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target && header) {
        e.preventDefault();
        const offset = header.offsetHeight + 16;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ─── 4. ACTIVE NAV LINK (section-aware highlight) ─── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('#main-nav a[id]');

  function setActiveNav() {
    if (!header) return;
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - header.offsetHeight - 60) {
        current = sec.id;
      }
    });
    navLinks.forEach(link =>
      link.classList.toggle('active', link.getAttribute('href') === '#' + current)
    );
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });

  /* ─── 5. NEW HERO SINGLE-CARD SLIDER ─── */
  const track      = document.getElementById('slider-track');
  const dots       = document.querySelectorAll('.new-dot');
  const prevBtn    = document.getElementById('slider-prev');
  const nextBtn    = document.getElementById('slider-next');
  const curDisplay = document.getElementById('slider-cur');
  const totalDisplay = document.getElementById('slider-total');

  if (track && dots.length > 0) {
    const SLIDE_COUNT = track.children.length;
    const AUTO_DELAY  = 5000;
    let current   = 0;
    let autoTimer = null;

    if (totalDisplay) totalDisplay.textContent = SLIDE_COUNT;

    function goTo(index, animate) {
      current = ((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;

      if (animate === false) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.52s cubic-bezier(0.4,0,0.2,1)';
      }

      track.style.transform = `translateX(-${current * 100}%)`;

      // Force reflow to apply 'none' transition instantly before re-enabling
      if (animate === false) {
        void track.offsetWidth;
        track.style.transition = '';
      }

      dots.forEach((d, i) => {
        d.classList.toggle('active', i === current);
        d.setAttribute('aria-selected', String(i === current));
      });

      if (curDisplay) curDisplay.textContent = current + 1;
    }

    function nextSlide()  { goTo(current + 1); }
    function prevSlide()  { goTo(current - 1); }
    function startAuto()  { stopAuto(); autoTimer = setInterval(nextSlide, AUTO_DELAY); }
    function stopAuto()   { clearInterval(autoTimer); autoTimer = null; }
    function resetAuto()  { stopAuto(); startAuto(); }

    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAuto(); }));

    // Touch swipe support
    let txStart = 0;
    let txEnd   = 0;
    const viewport = document.getElementById('slider-viewport');

    if (viewport) {
      viewport.addEventListener('touchstart', e => {
        txStart = e.changedTouches[0].clientX;
      }, { passive: true });

      viewport.addEventListener('touchend', e => {
        txEnd = e.changedTouches[0].clientX;
        if (Math.abs(txStart - txEnd) > 40) {
          txStart - txEnd > 0 ? nextSlide() : prevSlide();
          resetAuto();
        }
      }, { passive: true });

      // Pause on hover
      const sliderWrap = document.getElementById('featured-slider');
      if (sliderWrap) {
        sliderWrap.addEventListener('mouseenter', stopAuto);
        sliderWrap.addEventListener('mouseleave', startAuto);
      }

      // Keyboard navigation
      viewport.setAttribute('tabindex', '0');
      viewport.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  { prevSlide(); resetAuto(); }
        if (e.key === 'ArrowRight') { nextSlide(); resetAuto(); }
      });
    }

    // Init
    goTo(0, false);
    startAuto();
  }

  /* ─── 6. HIGHLIGHTS BAR COUNT-UP ANIMATION ─── */
  const hlNums = document.querySelectorAll('.new-hl-num[data-target]');
  let hlAnimated = false;

  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.textContent.replace(/[0-9]/g, '');
    let val = 0;
    const step = target / (1400 / 16);
    const ticker = setInterval(() => {
      val += step;
      if (val >= target) { val = target; clearInterval(ticker); }
      el.textContent = Math.floor(val) + suffix;
    }, 16);
  }

  const hlBar = document.getElementById('hl-bar');
  if (hlBar && hlNums.length > 0) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting && !hlAnimated) {
            hlAnimated = true;
            hlNums.forEach(animateCount);
          }
        });
      }, { threshold: 0.5 }).observe(hlBar);
    } else {
      hlNums.forEach(animateCount);
    }
  }

  /* ─── 7. SCROLL REVEAL (.reveal → .revealed) ─── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0) {
    if ('IntersectionObserver' in window) {
      const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            revealObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      revealEls.forEach(el => revealObs.observe(el));
    } else {
      // Fallback for very old browsers
      revealEls.forEach(el => el.classList.add('revealed'));
    }
  }

  /* ─── 8. MAPS MODAL ─── */
  const mapsModal  = document.getElementById('maps-modal');
  const modalClose = document.getElementById('modal-close');
  const mapsIframe = document.getElementById('maps-iframe');
  const modalTitle = document.getElementById('modal-title');
  const gmapsLink  = document.getElementById('modal-gmaps-link');

  if (mapsModal && modalClose && mapsIframe && modalTitle && gmapsLink) {
    function openModal(name, mapsUrl) {
      modalTitle.textContent = name || 'Lokasi Wisata';
      mapsIframe.src = mapsUrl;
      gmapsLink.href =
        'https://www.google.com/maps/search/' +
        encodeURIComponent(name + ', Desa Mondu, Sumba Timur');
      mapsModal.classList.add('open');
      mapsModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalClose.focus(), 100);
    }

    function closeModal() {
      mapsModal.classList.remove('open');
      mapsModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => { mapsIframe.src = ''; }, 350);
    }

    document.querySelectorAll('.btn-lokasi').forEach(btn => {
      btn.addEventListener('click', () =>
        openModal(btn.getAttribute('data-name'), btn.getAttribute('data-maps'))
      );
    });

    modalClose.addEventListener('click', closeModal);
    mapsModal.addEventListener('click', e => {
      if (e.target === mapsModal) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mapsModal.classList.contains('open')) closeModal();
    });
  }

  /* ─── 9. BACK TO TOP ─── */
  const backTopBtn = document.getElementById('back-to-top');
  if (backTopBtn) {
    window.addEventListener('scroll', () => {
      backTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backTopBtn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }

  console.log(
    '%c✦ jelita.kanatang — Loaded',
    'color:#2D6A4F;font-weight:700;font-size:13px;'
  );

});
