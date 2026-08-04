/* ═══════════════════════════════════════════════════════════════
 *  Oasis Site Config Loader
 *  Reads config from /api/config.php and applies to the page.
 *  Handles: manager contacts, address, emergency alerts, cards.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  var API = '/api/config.php';
  var BINS = {
    cards: 'cards',
    site: 'site',
    alert: 'alert'
  };

  function readBin(id) {
    return fetch(API + '?key=' + id).then(function (r) { return r.json(); });
  }

  /* ── Apply Site Config ── */
  function applySiteConfig(cfg) {
    if (!cfg) return;

    /* Manager contacts */
    var mgrEl = document.querySelector('[aria-label="Reveal manager contact details"]');
    if (mgrEl && (cfg.manager_name || cfg.manager_phone || cfg.manager_email)) {
      var valueEl = mgrEl.querySelector('.contact-detail__value');
      if (valueEl) {
        var parts = [];
        if (cfg.manager_name) parts.push('<strong>' + escHtml(cfg.manager_name) + '</strong>');
        if (cfg.manager_phone) parts.push('<a href="tel:' + escHtml(cfg.manager_phone) + '" style="color:#1767f6;text-decoration:none">' + escHtml(cfg.manager_phone) + '</a>');
        if (cfg.manager_email) parts.push('<a href="mailto:' + escHtml(cfg.manager_email) + '" style="color:#1767f6;text-decoration:none">' + escHtml(cfg.manager_email) + '</a>');
        valueEl.innerHTML = parts.join('<br>');
        valueEl.style.opacity = '1';
        valueEl.style.fontStyle = 'normal';
        valueEl.style.fontSize = '';
        mgrEl.style.cursor = 'default';
        mgrEl.removeAttribute('tabindex');
        mgrEl.removeAttribute('role');
      }
    }

    /* Address */
    if (cfg.address_line1 || cfg.address_line2) {
      var addrLabels = document.querySelectorAll('.contact-detail__label');
      addrLabels.forEach(function (label) {
        if (label.textContent.trim() === 'Address') {
          var valEl = label.nextElementSibling;
          if (valEl && valEl.classList.contains('contact-detail__value')) {
            valEl.innerHTML = escHtml(cfg.address_line1) + '<br>' + escHtml(cfg.address_line2);
          }
        }
      });
    }
  }

  /* ── Emergency Alert ── */
  function showAlert(cfg) {
    if (!cfg || !cfg.active) return;
    if (sessionStorage.getItem('oasis_alert_dismissed')) return;

    var colors = {
      warning: { bg: 'rgba(234,179,8,0.12)', border: '#eab308', text: '#fbbf24', btnBg: '#eab308', btnText: '#000' },
      critical: { bg: 'rgba(220,38,38,0.12)', border: '#dc2626', text: '#f87171', btnBg: '#dc2626', btnText: '#fff' }
    };
    var c = colors[cfg.severity] || colors.warning;

    var overlay = document.createElement('div');
    overlay.id = 'oasis-emergency-alert';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:24px;animation:oasisAlertFadeIn 0.4s';

    var card = document.createElement('div');
    card.style.cssText = 'background:#1a1a2e;border:2px solid ' + c.border + ';border-radius:16px;padding:40px;max-width:560px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,0.5)';

    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:3rem;margin-bottom:16px';
    icon.textContent = cfg.severity === 'critical' ? '🚨' : '⚠️';
    card.appendChild(icon);

    var h = document.createElement('h2');
    h.style.cssText = 'margin:0 0 16px;font-size:1.4rem;font-weight:700;color:' + c.text + ';font-family:system-ui,sans-serif';
    h.textContent = cfg.headline || 'Emergency Notice';
    card.appendChild(h);

    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 32px;font-size:1rem;line-height:1.7;color:rgba(255,255,255,0.8);font-family:system-ui,sans-serif';
    p.textContent = cfg.message;
    card.appendChild(p);

    var btn = document.createElement('button');
    btn.style.cssText = 'padding:14px 40px;background:' + c.btnBg + ';color:' + c.btnText + ';border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;transition:opacity 0.2s';
    btn.textContent = 'I Understand';
    btn.addEventListener('mouseenter', function () { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '1'; });
    btn.addEventListener('click', function () {
      overlay.style.animation = 'oasisAlertFadeOut 0.3s forwards';
      setTimeout(function () { overlay.remove(); }, 300);
      sessionStorage.setItem('oasis_alert_dismissed', '1');
    });
    card.appendChild(btn);

    overlay.appendChild(card);

    overlay.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function alertKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
      if (!document.getElementById('oasis-emergency-alert')) {
        document.removeEventListener('keydown', alertKey);
      }
    });

    if (!document.getElementById('oasis-alert-css')) {
      var style = document.createElement('style');
      style.id = 'oasis-alert-css';
      style.textContent = '@keyframes oasisAlertFadeIn{from{opacity:0}to{opacity:1}} @keyframes oasisAlertFadeOut{from{opacity:1}to{opacity:0}}';
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
  }

  /* ── Utilities ── */
  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  /* ── Apply Cards Config ── */
  function applyCardsConfig(cards) {
    if (!cards) return;

    /* Inject CSS to center cards if needed (without breaking grid layout) */
    if (!document.getElementById('oasis-cards-centering-css')) {
      var style = document.createElement('style');
      style.id = 'oasis-cards-centering-css';
      style.textContent =
        '[class*="buyGrid"] {' +
        '  justify-content: center;' +
        '}';
      document.head.appendChild(style);
    }

    var attempts = 0;
    var checkGrid = setInterval(function () {
      attempts++;
      var grid = document.querySelector('[class*="buyGrid"]');
      var toggleWrap = document.querySelector('[class*="toggleWrap"]');

      if ((!grid || !toggleWrap) && attempts < 50) return;
      clearInterval(checkGrid);
      if (!grid || !toggleWrap) return;

      var activeTab = 'sale';

      function buildCardHtml(list, isRent) {
        var html = '';
        list.forEach(function (card) {
          if (card.status === 'hidden') return;
          var img = card.image_url || (card.images && card.images[0]) || '';
          var link = card.href || (isRent ? 'https://oasisresort.ca/sites-for-rent/' : 'https://oasisresort.ca/sites-for-sale/');

          html += '<div class="BookingSection-module__nsIaiG__buyCard">'
            + '<div class="BookingSection-module__nsIaiG__buyCardImage">'
            + '<img src="' + escHtml(img) + '" alt="' + escHtml(card.title) + '"/>'
            + '<span class="BookingSection-module__nsIaiG__buyCardPrice">' + escHtml(card.price) + '</span>'
            + '</div>'
            + '<a href="' + escHtml(link) + '" target="_blank" rel="noreferrer" class="BookingSection-module__nsIaiG__buyCardInfo">'
            + '<h4 class="BookingSection-module__nsIaiG__buyCardTitle">' + escHtml(card.title) + '</h4>'
            + '<div class="BookingSection-module__nsIaiG__buyCardMeta">'
            + '<span>' + escHtml(card.lot_type) + '</span>'
            + '<span>' + escHtml(card.sqft) + '</span>'
            + '</div>'
            + '<p class="BookingSection-module__nsIaiG__buyCardDesc">' + escHtml(card.description) + '</p>'
            + '</a>'
            + '</div>';
        });
        return html;
      }

      function renderCards() {
        var list = cards[activeTab] || [];
        grid.innerHTML = buildCardHtml(list, activeTab === 'rental');
      }

      var oldBtns = toggleWrap.querySelectorAll('[class*="toggleBtn"]');
      if (oldBtns.length >= 2) {
        var buyBtn = oldBtns[0];
        var rentBtn = oldBtns[1];

        var btnBaseClass = '';
        var btnActiveClass = '';
        oldBtns[0].className.split(/\s+/).forEach(function(c) {
          if (c.indexOf('toggleBtnActive') > -1) btnActiveClass = c;
          else if (c.indexOf('toggleBtn') > -1) btnBaseClass = c;
        });
        if (!btnActiveClass) {
          oldBtns[1].className.split(/\s+/).forEach(function(c) {
            if (c.indexOf('toggleBtnActive') > -1) btnActiveClass = c;
          });
        }

        var pill = toggleWrap.querySelector('[class*="togglePill"]');

        function updatePill(activeBtn) {
          if (pill && activeBtn) {
            pill.style.left = activeBtn.offsetLeft + 'px';
            pill.style.width = activeBtn.offsetWidth + 'px';
          }
        }

        function setActive(tab) {
          activeTab = tab;
          if (tab === 'sale') {
            buyBtn.className = btnBaseClass + ' ' + btnActiveClass;
            rentBtn.className = btnBaseClass + ' ';
            updatePill(buyBtn);
          } else {
            buyBtn.className = btnBaseClass + ' ';
            rentBtn.className = btnBaseClass + ' ' + btnActiveClass;
            updatePill(rentBtn);
          }
          renderCards();
        }

        // Run once initially to position the pill correctly
        setTimeout(function() {
          updatePill(activeTab === 'sale' ? buyBtn : rentBtn);
        }, 50);

        var newBuy = buyBtn.cloneNode(true);
        var newRent = rentBtn.cloneNode(true);
        buyBtn.parentNode.replaceChild(newBuy, buyBtn);
        rentBtn.parentNode.replaceChild(newRent, rentBtn);
        buyBtn = newBuy;
        rentBtn = newRent;

        buyBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setActive('sale');
        }, true);

        rentBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setActive('rental');
        }, true);
      }

      var panel = grid.closest('[class*="panel"]');
      if (panel) {
        panel.style.display = 'block';
        panel.style.opacity = '1';
      }

      renderCards();
    }, 100);
  }

  /* ── Failsafe: force-hide loading overlay ── */
  function forceHideLoader() {
    var FAILSAFE_MS = 8000; // 8 seconds max
    setTimeout(function () {
      var loader = document.querySelector('[class*="LoadingEmblem-module__Aq2CBa__overlay"]');
      if (loader && !loader.classList.contains('LoadingEmblem-module__Aq2CBa__fadeOut')) {
        // The React LoadingEmblem has a race condition where the fadeOut class
        // is never applied if Three.js doesn't start loading. Force it.
        loader.classList.add('LoadingEmblem-module__Aq2CBa__fadeOut');
      }
    }, FAILSAFE_MS);
  }

  /* ── Init ── */
  function init() {
    // Start failsafe timer immediately
    forceHideLoader();

    var attempts = 0;
    var waitHydration = setInterval(function () {
      attempts++;
      
      // Wait for React to finish hydration by checking if the loader overlay is gone or faded out
      var loader = document.querySelector('[class*="LoadingEmblem-module__Aq2CBa__overlay"]');
      var isLoaded = !loader || loader.classList.contains('LoadingEmblem-module__Aq2CBa__fadeOut') || window.getComputedStyle(loader).opacity === '0' || window.getComputedStyle(loader).visibility === 'hidden';
      
      // Wait up to 15 seconds (150 attempts) for hydration
      if (!isLoaded && attempts < 150) return;
      
      clearInterval(waitHydration);
      
      // Now it is safe to fetch and apply configurations without crashing React hydration
      readBin(BINS.alert).then(showAlert).catch(function () {});
      readBin(BINS.site).then(applySiteConfig).catch(function () {});
      readBin(BINS.cards).then(applyCardsConfig).catch(function () {});
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
