/*
 * apple-records.js — interaction layer for the Hall of Fame "apple-design"
 * variant. Three independent pieces, each a direct translation of a
 * principle from the skill:
 *
 *   1. Segmented control: By Coach / By Award slide a single indicator
 *      pill between positions (spatial consistency) instead of two
 *      buttons independently swapping color.
 *   2. Disclosure chips: tap-to-reveal years, driven entirely by a CSS
 *      class toggle so the "materialize" transition in apple-records.css
 *      does the animating — feedback fires on pointerdown, not click.
 *   3. Scroll-spy jump-nav: IntersectionObserver answers "where am I"
 *      continuously, not just as a static list of links (wayfinding).
 *
 * No animation library — everything here is a class toggle; the actual
 * motion lives in CSS transitions so prefers-reduced-motion in one place
 * (apple-records.css) governs all of it.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ── 1. Segmented control ────────────────────────────────────────────
  function initSegmented() {
    document.querySelectorAll('.segmented').forEach(function (group) {
      var indicator = group.querySelector('.segmented-indicator');
      var buttons = Array.prototype.slice.call(group.querySelectorAll('button'));
      if (!indicator || !buttons.length) return;

      function place(btn, animate) {
        var prevTransition = indicator.style.transition;
        if (!animate) indicator.style.transition = 'none';
        indicator.style.width = btn.offsetWidth + 'px';
        indicator.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
        if (!animate) {
          // force reflow so the "none" transition actually applies before restoring it
          void indicator.offsetWidth;
          indicator.style.transition = prevTransition;
        }
      }

      var active = group.querySelector('button.active') || buttons[0];
      place(active, false);

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          place(btn, true);
          var targetSel = btn.getAttribute('data-pane-target');
          if (targetSel) {
            group.closest('[data-segmented-scope]').querySelectorAll('.segmented-pane').forEach(function (p) {
              p.classList.toggle('d-none', '#' + p.id !== targetSel);
            });
          }
        });
      });

      window.addEventListener('resize', function () {
        var current = group.querySelector('button.active') || buttons[0];
        place(current, false);
      }, { passive: true });
    });
  }

  // ── 2. Disclosure chips ─────────────────────────────────────────────
  function initDisclosures() {
    document.querySelectorAll('.disclosure-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var wrap = trigger.closest('.disclosure');
        if (!wrap) return;
        var open = wrap.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  // ── 3. Scroll-spy jump-nav ──────────────────────────────────────────
  function initScrollSpy() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.jump-chip[data-target]'));
    if (!chips.length || !('IntersectionObserver' in window)) return;

    var sections = chips
      .map(function (chip) { return document.getElementById(chip.getAttribute('data-target')); })
      .filter(Boolean);

    var byId = {};
    chips.forEach(function (chip) { byId[chip.getAttribute('data-target')] = chip; });

    var current = null;
    function setActive(id) {
      if (id === current) return;
      current = id;
      chips.forEach(function (chip) {
        chip.classList.toggle('is-active', chip.getAttribute('data-target') === id);
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      // Prefer the entry closest to the top of the viewport (most "current" section).
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(visible[0].target.id);
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  ready(function () {
    initSegmented();
    initDisclosures();
    initScrollSpy();
  });
})();
