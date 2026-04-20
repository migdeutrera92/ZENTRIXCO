/**
 * Standalone Number Counter Animation
 * This script is loaded WITHOUT type="module" to ensure immediate execution.
 * It uses IntersectionObserver + scroll fallback for maximum reliability.
 */
(function () {
  'use strict';

  var animated = [];

  function hasBeenAnimated(el) {
    return animated.indexOf(el) !== -1;
  }

  function markAnimated(el) {
    animated.push(el);
  }

  function animateNumber(el) {
    if (hasBeenAnimated(el)) return;
    markAnimated(el);

    var countTo = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var isDecimal = countTo % 1 !== 0;
    var duration = 1800;
    var startTime = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easeOutCubic(progress);
      var currentValue = easedProgress * countTo;

      if (isDecimal) {
        el.textContent = prefix + currentValue.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.floor(currentValue) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (isDecimal) {
          el.textContent = prefix + countTo.toFixed(1) + suffix;
        } else {
          el.textContent = prefix + countTo + suffix;
        }
      }
    }

    requestAnimationFrame(step);
  }

  function checkAllCounters() {
    var counters = document.querySelectorAll('[data-count]');
    for (var i = 0; i < counters.length; i++) {
      var el = counters[i];
      // Skip hidden elements
      if (el.offsetParent === null && el.getClientRects().length === 0) continue;
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        animateNumber(el);
      }
    }
  }

  // Use IntersectionObserver if available
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          animateNumber(entries[i].target);
        }
      }
    }, { threshold: 0.05 });

    function observeCounters() {
      var counters = document.querySelectorAll('[data-count]');
      for (var i = 0; i < counters.length; i++) {
        observer.observe(counters[i]);
      }
    }

    // Observe as soon as possible
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeCounters);
    } else {
      observeCounters();
    }
    // Also observe on load in case new elements appear
    window.addEventListener('load', function () {
      observeCounters();
      // Extra safety: run scroll check too
      checkAllCounters();
    });
  }

  // Scroll-based fallback (always active)
  window.addEventListener('scroll', checkAllCounters, { passive: true });

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      checkAllCounters();
      setTimeout(checkAllCounters, 300);
      setTimeout(checkAllCounters, 800);
    });
  } else {
    checkAllCounters();
    setTimeout(checkAllCounters, 300);
    setTimeout(checkAllCounters, 800);
  }

  // Run on load
  window.addEventListener('load', function () {
    checkAllCounters();
    setTimeout(checkAllCounters, 200);
    setTimeout(checkAllCounters, 600);
    setTimeout(checkAllCounters, 1200);
  });

  // Handle industry tab switching (soluciones page)
  document.addEventListener('click', function (e) {
    var tab = e.target;
    while (tab && !tab.classList.contains('industry-tab')) {
      tab = tab.parentElement;
    }
    if (tab) {
      // Reset animation for counters in newly visible panels
      setTimeout(function () {
        var panels = document.querySelectorAll('.industry-panel');
        for (var i = 0; i < panels.length; i++) {
          if (panels[i].style.display !== 'none') {
            var panelCounters = panels[i].querySelectorAll('[data-count]');
            for (var j = 0; j < panelCounters.length; j++) {
              var idx = animated.indexOf(panelCounters[j]);
              if (idx !== -1) {
                animated.splice(idx, 1);
              }
            }
          }
        }
        checkAllCounters();
      }, 200);
    }
  });
})();