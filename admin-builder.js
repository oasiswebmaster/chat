/* ═══════════════════════════════════════════════════════════════
 *  Oasis Visual Web Builder
 *  Premium admin panel with live preview, drag-drop, and
 *  WYSIWYG editing.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  var API = '/api/config.php';

  function readBin(id) { return fetch(API+'?key='+id).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}); }
  function writeBin(id, data) { return fetch(API+'?key='+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}); }
  function esc(s) { var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

  /* ── State ── */
  var S = {
    site: {manager_name:'',manager_phone:'',manager_email:'',address_line1:'2615 Lakeshore Dr',address_line2:'Osoyoos, BC V0H 1V6'},
    alert: {active:false,severity:'warning',headline:'',message:''},
    cards: {sale:[],rental:[]},
    pages: {},
    navigation: [],
    tab: 0, cardsTab: 'sale', dirty: {}
  };

  var editingPageSlug = '';

  /* ── Inject Styles ── */
  var st = document.createElement('style'); st.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    [class*="dashboard"]{display:none!important}
    .vb{position:fixed;inset:0;z-index:99999;background:#0c0a15;display:none;font-family:'Inter',system-ui,sans-serif;color:#e0e0e0;overflow:hidden}
    .vb.open{display:flex;flex-direction:column;animation:vbIn .3s}
    @keyframes vbIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}

    /* ── Top Bar ── */
    .vb-top{display:flex;align-items:center;height:54px;padding:0 20px;background:linear-gradient(135deg,#0f0b1e,#1a1432);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
    .vb-logo{font-size:.95rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px}
    .vb-logo span{background:linear-gradient(135deg,#1767f6,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .vb-top-actions{margin-left:auto;display:flex;gap:8px;align-items:center}
    .vb-saved{font-size:.72rem;color:#16a34a;opacity:0;transition:opacity .3s}
    .vb-saved.show{opacity:1}

    /* ── Tabs ── */
    .vb-tabs{display:flex;height:44px;background:#0a0816;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0;padding:0 20px;gap:2px}
    .vb-tab{padding:0 20px;display:flex;align-items:center;gap:6px;font-size:.8rem;font-weight:500;color:rgba(255,255,255,.35);cursor:pointer;border-bottom:2px solid transparent;transition:all .25s;user-select:none}
    .vb-tab:hover{color:rgba(255,255,255,.6)}
    .vb-tab.on{color:#fff;border-bottom-color:#1767f6}

    /* ── Split Layout ── */
    .vb-body{flex:1;display:flex;overflow:hidden}
    .vb-editor{width:420px;min-width:360px;background:#0e0b1a;border-right:1px solid rgba(255,255,255,.06);overflow-y:auto;padding:20px;flex-shrink:0}
    .vb-preview-wrap{flex:1;background:#111;display:flex;flex-direction:column;overflow:hidden}
    .vb-preview-bar{height:36px;background:#0a0816;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;padding:0 16px;gap:6px;flex-shrink:0}
    .vb-preview-dot{width:8px;height:8px;border-radius:50%}
    .vb-preview-bar span{font-size:.7rem;color:rgba(255,255,255,.25);margin-left:8px}
    .vb-preview-frame{flex:1;background:#fdf4f2;overflow-y:auto;padding:40px}

    /* ── Section Panel ── */
    .vb-sec{display:none}.vb-sec.on{display:block}
    .vb-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px;margin-bottom:16px;transition:border .2s}
    .vb-card:hover{border-color:rgba(23,103,246,.3)}
    .vb-card h3{margin:0 0 14px;font-size:.85rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px}
    .vb-card h3 .badge{font-size:.65rem;padding:2px 8px;border-radius:10px;font-weight:500}

    /* ── Fields ── */
    .vb-f{margin-bottom:14px}
    .vb-f label{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.3);margin-bottom:5px;font-weight:500}
    .vb-f input,.vb-f textarea,.vb-f select{width:100%;padding:9px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:.85rem;font-family:inherit;outline:none;transition:all .25s}
    .vb-f input:focus,.vb-f textarea:focus,.vb-f select:focus{border-color:#1767f6;background:rgba(23,103,246,.06);box-shadow:0 0 0 3px rgba(23,103,246,.1)}
    .vb-f textarea{resize:vertical;min-height:100px;line-height:1.6}
    .vb-row{display:flex;gap:12px}.vb-row .vb-f{flex:1}

    /* ── Buttons ── */
    .vb-btn{padding:9px 20px;border:none;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
    .vb-btn:active{transform:scale(.97)}
    .vb-pub{background:linear-gradient(135deg,#1767f6,#1252d4);color:#fff;box-shadow:0 4px 15px rgba(23,103,246,.3)}
    .vb-pub:hover{box-shadow:0 6px 20px rgba(23,103,246,.45);transform:translateY(-1px)}
    .vb-del{background:rgba(220,38,38,.15);color:#f87171;border:1px solid rgba(220,38,38,.2)}
    .vb-del:hover{background:rgba(220,38,38,.25)}
    .vb-ghost{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.1)}
    .vb-ghost:hover{color:#fff;border-color:rgba(255,255,255,.25)}
    .vb-actions{display:flex;gap:8px;margin-top:18px}

    /* ── Toggle ── */
    .vb-toggle{position:relative;display:inline-flex;align-items:center;gap:14px;cursor:pointer;user-select:none}
    .vb-toggle input{display:none}
    .vb-ttrack{width:52px;height:28px;background:rgba(255,255,255,.1);border-radius:14px;position:relative;transition:background .3s}
    .vb-toggle input:checked+.vb-ttrack{background:#16a34a}
    .vb-tknob{position:absolute;top:3px;left:3px;width:22px;height:22px;background:#fff;border-radius:50%;transition:transform .3s;box-shadow:0 2px 6px rgba(0,0,0,.3)}
    .vb-toggle input:checked~.vb-tknob{transform:translateX(24px)}
    .vb-tlabel{font-size:.85rem;font-weight:500;transition:color .3s}

    /* ── Listing Cards (drag-drop) ── */
    .vb-listing{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;margin-bottom:10px;cursor:grab;transition:all .25s;display:flex;align-items:center;gap:12px;user-select:none}
    .vb-listing:hover{border-color:rgba(23,103,246,.3);background:rgba(23,103,246,.04)}
    .vb-listing.dragging{opacity:.5;border-color:#1767f6;box-shadow:0 8px 25px rgba(23,103,246,.2)}
    .vb-listing.dragover{border-color:#1767f6;border-style:dashed}
    .vb-listing.selected{border-color:#1767f6;background:rgba(23,103,246,.08)}
    .vb-listing .grip{color:rgba(255,255,255,.15);font-size:1.1rem;cursor:grab;flex-shrink:0}
    .vb-listing .thumb{width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#222}
    .vb-listing .info{flex:1;min-width:0}
    .vb-listing .info h4{margin:0;font-size:.8rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vb-listing .info p{margin:2px 0 0;font-size:.7rem;color:rgba(255,255,255,.35)}
    .vb-listing .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .vb-listing .dot.active{background:#16a34a}.vb-listing .dot.hidden{background:rgba(255,255,255,.15)}
    .vb-card-tabs{display:flex;gap:2px;margin-bottom:14px}
    .vb-card-tab{padding:6px 16px;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;color:rgba(255,255,255,.4)}
    .vb-card-tab:hover{color:rgba(255,255,255,.6)}
    .vb-card-tab.on{background:rgba(23,103,246,.15);color:#1767f6}

    /* ── Live Preview Sections ── */
    .pvw-section{background:#fff;border-radius:16px;padding:32px;margin-bottom:24px;box-shadow:0 2px 12px rgba(0,0,0,.06);transition:box-shadow .3s;position:relative}
    .pvw-section:hover{box-shadow:0 4px 20px rgba(0,0,0,.1)}
    .pvw-section::before{content:attr(data-label);position:absolute;top:-10px;left:16px;background:#1767f6;color:#fff;padding:2px 10px;border-radius:6px;font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
    .pvw-label{font-size:.65rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(23,103,246,.5);font-weight:500;margin-bottom:6px}
    .pvw-heading{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.6rem;color:#1767f6;font-weight:300;margin:0 0 12px;line-height:1.2}
    .pvw-body{font-size:.85rem;color:rgba(23,103,246,.55);line-height:1.8}
    .pvw-body p{margin:0 0 8px}
    .pvw-contact{margin-top:16px}
    .pvw-contact-item{margin-bottom:12px}
    .pvw-contact-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(0,0,0,.35);font-weight:600;margin-bottom:3px}
    .pvw-contact-value{font-size:.9rem;color:#1f2937;line-height:1.5}
    .pvw-contact-value a{color:#1767f6;text-decoration:none}
    .pvw-alert{border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;animation:pvwPulse 2s infinite}
    .pvw-alert.warning{background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b}
    .pvw-alert.critical{background:linear-gradient(135deg,#fee2e2,#fecaca);border:2px solid #ef4444}
    .pvw-alert.off{background:#f3f4f6;border:2px dashed #d1d5db}
    .pvw-alert h3{margin:0 0 8px;font-size:1.1rem;font-weight:700}
    .pvw-alert p{margin:0;font-size:.85rem;line-height:1.6;color:#374151}
    .pvw-alert .dismiss-btn{margin-top:16px;padding:8px 24px;border:none;border-radius:6px;font-weight:700;font-size:.85rem;cursor:default}
    .pvw-alert.warning h3{color:#92400e}.pvw-alert.warning .dismiss-btn{background:#f59e0b;color:#000}
    .pvw-alert.critical h3{color:#991b1b}.pvw-alert.critical .dismiss-btn{background:#ef4444;color:#fff}
    .pvw-alert.off h3{color:#9ca3af;font-weight:400;font-size:.9rem}
    @keyframes pvwPulse{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 4px rgba(239,68,68,.15)}}
    .pvw-alert.off{animation:none}

    /* ── Footer ── */
    .vb-footer{padding:14px 24px;background:#080612;border-top:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;flex-wrap:wrap;gap:8px}
    .vb-footer-logo{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.3)}
    .vb-footer-links{display:flex;gap:16px;list-style:none;margin:0;padding:0}
    .vb-footer-links a{font-size:.72rem;color:rgba(255,255,255,.25);text-decoration:none;transition:color .2s}
    .vb-footer-links a:hover{color:#1767f6}
    .vb-footer-copy{font-size:.65rem;color:rgba(255,255,255,.15);width:100%;text-align:center;margin-top:4px}

    /* ── Card Preview ── */
    .pvw-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .pvw-card{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);transition:transform .2s}
    .pvw-card:hover{transform:translateY(-2px)}
    .pvw-card img{width:100%;height:80px;object-fit:cover;background:#e5e7eb}
    .pvw-card-body{padding:10px}
    .pvw-card-body h4{margin:0 0 2px;font-size:.72rem;font-weight:600;color:#1f2937}
    .pvw-card-body p{margin:0;font-size:.62rem;color:#6b7280}
    .pvw-card .price-tag{position:absolute;bottom:84px;left:8px;background:rgba(0,0,0,.7);color:#fff;padding:2px 8px;border-radius:4px;font-size:.65rem;font-weight:600}

    /* ── Toast ── */
    .vb-toast{position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:10px;font-size:.85rem;font-weight:500;color:#fff;z-index:100001;display:flex;align-items:center;gap:8px;animation:vbToastIn .3s;box-shadow:0 8px 25px rgba(0,0,0,.3)}
    .vb-toast.ok{background:linear-gradient(135deg,#16a34a,#15803d)}.vb-toast.err{background:linear-gradient(135deg,#dc2626,#b91c1c)}
    @keyframes vbToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  `; document.head.appendChild(st);

  function toast(msg,type){var t=document.createElement('div');t.className='vb-toast '+(type||'ok');t.innerHTML=(type==='err'?'✕ ':'✓ ')+esc(msg);document.body.appendChild(t);setTimeout(function(){t.style.animation='vbToastIn .3s reverse forwards';setTimeout(function(){t.remove()},300)},3000)}

  /* ══════════════════════════════════════════════════ */
  /*                    BUILD UI                        */
  /* ══════════════════════════════════════════════════ */
  function buildUI() {
    var root = overlay;
    root.innerHTML = '';

    /* ── Top Bar ── */
    root.innerHTML = '<div class="vb-top"><div class="vb-logo"><span>Oasis Web Builder</span></div><div class="vb-top-actions"><span class="vb-saved" id="vb-saved">Saved</span><button class="vb-btn vb-ghost" id="vb-close">Logout</button></div></div>';

    /* ── Tabs ── */
    var tabs = [
      {label:'Listings'},
      {label:'Site Content'},
      {label:'Emergency Alert'},
      {label:'Pages & Links'}
    ];
    var tabBar = document.createElement('div'); tabBar.className = 'vb-tabs';
    tabs.forEach(function(t,i){
      var tb = document.createElement('div'); tb.className = 'vb-tab'+(i===0?' on':''); tb.dataset.idx = i;
      tb.innerHTML = t.label;
      tb.addEventListener('click', function(){ switchTab(i); });
      tabBar.appendChild(tb);
    });
    root.appendChild(tabBar);

    /* ── Body (split pane) ── */
    var body = document.createElement('div'); body.className = 'vb-body';

    /* Editor pane */
    var editor = document.createElement('div'); editor.className = 'vb-editor'; editor.id = 'vb-editor';

    /* Preview pane */
    var previewWrap = document.createElement('div'); previewWrap.className = 'vb-preview-wrap';
    previewWrap.innerHTML = '<div class="vb-preview-bar"><div class="vb-preview-dot" style="background:#ef4444"></div><div class="vb-preview-dot" style="background:#eab308"></div><div class="vb-preview-dot" style="background:#22c55e"></div><span>Live Preview — oasis-resort.ca</span></div>';
    var previewFrame = document.createElement('div'); previewFrame.className = 'vb-preview-frame'; previewFrame.id = 'vb-preview';
    previewWrap.appendChild(previewFrame);

    body.appendChild(editor);
    body.appendChild(previewWrap);
    root.appendChild(body);

    /* ── Footer ── */
    var footer = document.createElement('div'); footer.className = 'vb-footer';
    footer.innerHTML = '<span class="vb-footer-logo">Oasis Resort</span>'
      + '<ul class="vb-footer-links">'
      + '<li><a href="/coming-soon?page=resort-info" target="_blank">Resort Info</a></li>'
      + '<li><a href="/coming-soon?page=bookings" target="_blank">Bookings</a></li>'
      + '<li><a href="/coming-soon?page=sale" target="_blank">Sale</a></li>'
      + '<li><a href="https://portal.oasisresort.ca/" target="_blank" rel="noreferrer">Owner Login</a></li>'
      + '<li><a href="/coming-soon?page=privacy" target="_blank">Privacy</a></li>'
      + '</ul>'
      + '<div class="vb-footer-copy">© 2026 Oasis RV Resort Owners Association. Designed by <a href="https://www.instagram.com/photon.alchemist" target="_blank" rel="noreferrer">@photon.alchemist</a></div>';
    root.appendChild(footer);

    /* ── Close ── */
    document.getElementById('vb-close').addEventListener('click', function(){
      sessionStorage.removeItem("admin_session");
      window.location.reload();
    });

    buildSections();
    switchTab(0);
    renderPreview();
  }

  /* ── Tab switching ── */
  function switchTab(idx) {
    S.tab = idx;
    document.querySelectorAll('.vb-tab').forEach(function(t,i){ t.classList.toggle('on',i===idx); });
    document.querySelectorAll('.vb-sec').forEach(function(s,i){ s.classList.toggle('on',i===idx); });
    if (idx === 3) {
      renderPagesTab();
    }
    renderPreview();
  }

  /* ══════════════════════════════════════════════════ */
  /*              BUILD EDITOR SECTIONS                 */
  /* ══════════════════════════════════════════════════ */
  function buildSections() {
    var ed = document.getElementById('vb-editor');

    /* ── 1. LISTINGS ── */
    var sec0 = document.createElement('div'); sec0.className = 'vb-sec on'; sec0.id = 'sec-listings';

    /* Sub-tabs: Sale / Rental */
    var cardTabs = document.createElement('div'); cardTabs.className = 'vb-card-tabs';
    ['sale','rental'].forEach(function(type){
      var ct = document.createElement('div'); ct.className = 'vb-card-tab'+(type==='sale'?' on':'');
      ct.textContent = type==='sale'?'For Sale':'For Rent';
      ct.addEventListener('click', function(){
        S.cardsTab = type;
        cardTabs.querySelectorAll('.vb-card-tab').forEach(function(c){c.classList.remove('on')});
        ct.classList.add('on');
        renderListings();
        renderPreview();
      });
      cardTabs.appendChild(ct);
    });
    sec0.appendChild(cardTabs);

    var listWrap = document.createElement('div'); listWrap.id = 'vb-list-wrap';
    sec0.appendChild(listWrap);

    /* Edit form (hidden until card selected) */
    var editForm = document.createElement('div'); editForm.id = 'vb-edit-form'; editForm.style.display = 'none';
    sec0.appendChild(editForm);

    /* Publish button */
    sec0.innerHTML += '<div class="vb-actions" style="margin-top:20px"><button class="vb-btn vb-pub" id="pub-cards">Publish Listings</button></div>';

    ed.appendChild(sec0);

    /* ── 2. SITE CONTENT ── */
    var sec1 = document.createElement('div'); sec1.className = 'vb-sec'; sec1.id = 'sec-site';
    sec1.innerHTML = `
      <div class="vb-card"><h3>On Site Managers</h3>
        <div class="vb-f"><label>Manager Name(s)</label><input id="f-mgr-name" type="text" placeholder="e.g. John & Jane Smith"></div>
        <div class="vb-row">
          <div class="vb-f"><label>Phone</label><input id="f-mgr-phone" type="text" placeholder="(250) 495-1234"></div>
          <div class="vb-f"><label>Email</label><input id="f-mgr-email" type="text" placeholder="manager@oasisresort.ca"></div>
        </div>
      </div>
      <div class="vb-card"><h3>Resort Address</h3>
        <div class="vb-f"><label>Street</label><input id="f-addr1" type="text" placeholder="2615 Lakeshore Dr"></div>
        <div class="vb-f"><label>City / Province / Postal</label><input id="f-addr2" type="text" placeholder="Osoyoos, BC V0H 1V6"></div>
      </div>
      <div class="vb-actions"><button class="vb-btn vb-pub" id="pub-site">Publish Site Content</button></div>
    `;
    ed.appendChild(sec1);

    /* ── 3. EMERGENCY ALERT ── */
    var sec2 = document.createElement('div'); sec2.className = 'vb-sec'; sec2.id = 'sec-alert';
    sec2.innerHTML = `
      <div class="vb-card"><h3>Emergency Alert <span class="badge" id="alert-badge" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.35)">OFF</span></h3>
        <label class="vb-toggle">
          <input type="checkbox" id="f-alert-active">
          <span class="vb-ttrack"></span>
          <span class="vb-tknob"></span>
          <span class="vb-tlabel" id="alert-toggle-label" style="color:rgba(255,255,255,.35)">Alert is OFF</span>
        </label>
        <div style="margin-top:18px">
          <div class="vb-f"><label>Severity</label>
            <select id="f-alert-sev"><option value="warning">Warning (Amber)</option><option value="critical">Critical (Red)</option></select>
          </div>
          <div class="vb-f"><label>Headline</label><input id="f-alert-head" type="text" placeholder="e.g. Resort Closure Notice"></div>
          <div class="vb-f"><label>Message</label><textarea id="f-alert-msg" placeholder="e.g. The Oasis is shut down this weekend due to forest fire warning..."></textarea></div>
        </div>
      </div>
      <div class="vb-actions">
        <button class="vb-btn vb-pub" id="pub-alert">Publish Alert</button>
        <button class="vb-btn vb-del" id="clear-alert">Clear Alert</button>
      </div>
    `;
    ed.appendChild(sec2);

    /* ── 4. PAGES & LINKS ── */
    var sec3 = document.createElement('div'); sec3.className = 'vb-sec'; sec3.id = 'sec-pages';
    ed.appendChild(sec3);

    /* ── Bind events ── */
    setTimeout(bindEvents, 100);
  }

  /* ── Bind all field events ── */
  function bindEvents() {
    /* Site fields → live preview */
    ['f-mgr-name','f-mgr-phone','f-mgr-email','f-addr1','f-addr2'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('input', function(){ syncSiteState(); renderPreview(); });
    });

    /* Alert fields → live preview */
    var alertActive = document.getElementById('f-alert-active');
    if(alertActive) alertActive.addEventListener('change', function(){
      S.alert.active = alertActive.checked;
      var label = document.getElementById('alert-toggle-label');
      var badge = document.getElementById('alert-badge');
      if(label){label.textContent=alertActive.checked?'Alert is LIVE':'Alert is OFF';label.style.color=alertActive.checked?'#16a34a':'rgba(255,255,255,.35)'}
      if(badge){badge.textContent=alertActive.checked?'LIVE':'OFF';badge.style.background=alertActive.checked?'rgba(22,163,74,.2)':'rgba(255,255,255,.06)';badge.style.color=alertActive.checked?'#16a34a':'rgba(255,255,255,.35)'}
      renderPreview();
    });
    ['f-alert-sev','f-alert-head','f-alert-msg'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('input', function(){ syncAlertState(); renderPreview(); });
    });

    /* Publish buttons */
    var pubCards = document.getElementById('pub-cards');
    if(pubCards) pubCards.addEventListener('click', function(){
      writeBin('cards', S.cards).then(function(){toast('Listings published! Live for all visitors.')}).catch(function(){toast('Failed to publish','err')});
    });
    var pubSite = document.getElementById('pub-site');
    if(pubSite) pubSite.addEventListener('click', function(){
      syncSiteState();
      writeBin('site', S.site).then(function(){toast('Site content published! Live for all visitors.')}).catch(function(){toast('Failed to publish','err')});
    });
    var pubAlert = document.getElementById('pub-alert');
    if(pubAlert) pubAlert.addEventListener('click', function(){
      syncAlertState();
      writeBin('alert', S.alert).then(function(){toast(S.alert.active?'Alert is LIVE for all visitors!':'Alert saved (currently OFF).')}).catch(function(){toast('Failed to publish','err')});
    });
    var clearAlert = document.getElementById('clear-alert');
    if(clearAlert) clearAlert.addEventListener('click', function(){
      S.alert = {active:false,severity:'warning',headline:'',message:''};
      populateAlertFields();
      renderPreview();
      writeBin('alert', S.alert).then(function(){toast('Alert cleared.')}).catch(function(){toast('Failed','err')});
    });

    /* Populate fields with loaded data */
    populateSiteFields();
    populateAlertFields();
    renderListings();
  }

  function syncSiteState(){
    var g=function(id){var e=document.getElementById(id);return e?e.value:''};
    S.site={manager_name:g('f-mgr-name'),manager_phone:g('f-mgr-phone'),manager_email:g('f-mgr-email'),address_line1:g('f-addr1'),address_line2:g('f-addr2')};
  }
  function syncAlertState(){
    var g=function(id){var e=document.getElementById(id);return e?(e.type==='checkbox'?e.checked:e.value):''};
    S.alert={active:g('f-alert-active'),severity:g('f-alert-sev'),headline:g('f-alert-head'),message:g('f-alert-msg')};
  }
  function populateSiteFields(){
    var s=S.site;
    var set=function(id,v){var e=document.getElementById(id);if(e)e.value=v||''};
    set('f-mgr-name',s.manager_name);set('f-mgr-phone',s.manager_phone);set('f-mgr-email',s.manager_email);
    set('f-addr1',s.address_line1);set('f-addr2',s.address_line2);
  }
  function populateAlertFields(){
    var a=S.alert;
    var set=function(id,v){var e=document.getElementById(id);if(e){if(e.type==='checkbox')e.checked=!!v;else e.value=v||''}};
    set('f-alert-active',a.active);set('f-alert-sev',a.severity);set('f-alert-head',a.headline);set('f-alert-msg',a.message);
    var cb=document.getElementById('f-alert-active');if(cb)cb.dispatchEvent(new Event('change'));
  }

  /* ══════════════════════════════════════════════════ */
  /*              DRAG-DROP LISTINGS                    */
  /* ══════════════════════════════════════════════════ */
  var dragIdx = -1;

  function renderListings(){
    var wrap = document.getElementById('vb-list-wrap'); if(!wrap) return;
    wrap.innerHTML = '';
    var list = S.cards[S.cardsTab] || [];
    list.forEach(function(card, i){
      var item = document.createElement('div'); item.className = 'vb-listing'; item.draggable = true; item.dataset.idx = i;
      item.innerHTML = '<div class="grip">⠿</div>'
        + '<img class="thumb" src="'+(card.image_url||card.images?.[0]||'')+'" onerror="this.style.background=\'#333\'">'
        + '<div class="info"><h4>'+esc(card.title||'Untitled')+'</h4><p>'+esc(card.price||'')+'  ·  '+esc(card.lot_type||'')+'</p></div>'
        + '<div class="dot '+(card.status||'active')+'"></div>';

      item.addEventListener('click', function(e){ if(e.target.classList.contains('grip')) return; selectCard(i); });
      item.addEventListener('dragstart', function(e){ dragIdx=i; item.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
      item.addEventListener('dragend', function(){ dragIdx=-1; item.classList.remove('dragging'); wrap.querySelectorAll('.vb-listing').forEach(function(l){l.classList.remove('dragover')}); });
      item.addEventListener('dragover', function(e){ e.preventDefault(); e.dataTransfer.dropEffect='move'; item.classList.add('dragover'); });
      item.addEventListener('dragleave', function(){ item.classList.remove('dragover'); });
      item.addEventListener('drop', function(e){
        e.preventDefault(); item.classList.remove('dragover');
        var toIdx = parseInt(item.dataset.idx);
        if(dragIdx>=0 && dragIdx!==toIdx){
          var arr = S.cards[S.cardsTab];
          var moved = arr.splice(dragIdx,1)[0];
          arr.splice(toIdx,0,moved);
          renderListings(); renderPreview();
        }
      });
      wrap.appendChild(item);
    });
  }

  function selectCard(idx){
    var form = document.getElementById('vb-edit-form'); if(!form) return;
    var card = S.cards[S.cardsTab][idx]; if(!card) return;

    document.querySelectorAll('.vb-listing').forEach(function(l,i){l.classList.toggle('selected',i===idx)});

    form.style.display = 'block';
    form.innerHTML = '<div class="vb-card"><h3>Edit — '+esc(card.title)+'</h3>'
      + '<div class="vb-f"><label>Title</label><input id="ce-title" value="'+esc(card.title||'')+'"></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Price</label><input id="ce-price" value="'+esc(card.price||'')+'"></div>'
      + '<div class="vb-f"><label>Lot / Site #</label><input id="ce-lot" value="'+esc(card.lot_number||'')+'"></div></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Type</label><input id="ce-type" value="'+esc(card.lot_type||'')+'"></div>'
      + '<div class="vb-f"><label>Size</label><input id="ce-sqft" value="'+esc(card.sqft||'')+'"></div></div>'
      + '<div class="vb-f"><label>Description</label><textarea id="ce-desc">'+esc(card.description||'')+'</textarea></div>'
      + '<div class="vb-f"><label>Image URL</label><input id="ce-img" value="'+esc(card.image_url||card.images?.[0]||'')+'"></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Status</label><select id="ce-status"><option value="active"'+(card.status==='active'?' selected':'')+'>Active</option><option value="hidden"'+(card.status==='hidden'?' selected':'')+'>Hidden</option></select></div>'
      + '<div class="vb-f"><label>Link URL</label><input id="ce-href" value="'+esc(card.href||'')+'"></div></div>'
      + '</div>';

    /* Bind live editing */
    ['ce-title','ce-price','ce-lot','ce-type','ce-sqft','ce-desc','ce-img','ce-status','ce-href'].forEach(function(id){
      var el = document.getElementById(id); if(!el) return;
      el.addEventListener('input', function(){
        var c = S.cards[S.cardsTab][idx];
        c.title=document.getElementById('ce-title').value;
        c.price=document.getElementById('ce-price').value;
        c.lot_number=document.getElementById('ce-lot').value;
        c.lot_type=document.getElementById('ce-type').value;
        c.sqft=document.getElementById('ce-sqft').value;
        c.description=document.getElementById('ce-desc').value;
        c.image_url=document.getElementById('ce-img').value;
        c.images=[document.getElementById('ce-img').value];
        c.status=document.getElementById('ce-status').value;
        c.href=document.getElementById('ce-href').value;
        renderListings(); renderPreview();
        document.querySelectorAll('.vb-listing')[idx]?.classList.add('selected');
      });
    });
  }

  /* ══════════════════════════════════════════════════ */
  /*            PAGES & LINKS EDITOR                    */
  /* ══════════════════════════════════════════════════ */
  function renderPagesTab() {
    var sec = document.getElementById('sec-pages');
    if (!sec) return;

    var html = '<div class="vb-card"><h3>Footer Navigation Links</h3>'
      + '  <div id="vb-nav-list" style="margin-bottom:14px;"></div>'
      + '  <button class="vb-btn vb-ghost" id="btn-add-nav-link" style="width:100%;">+ Add Link</button>'
      + '</div>';

    html += '<div class="vb-card"><h3>Custom Pages</h3>'
      + '  <div class="vb-f"><label>Select Page to Edit</label>'
      + '    <select id="pe-select-page"><option value="">-- Select a Page --</option>';
    
    Object.keys(S.pages).forEach(function(slug) {
      html += '<option value="' + slug + '">' + esc(S.pages[slug].title) + ' (' + slug + ')</option>';
    });
    
    html += '      <option value="new_page">+ Create New Page...</option>'
      + '    </select>'
      + '  </div>'
      + '  <div id="pe-page-editor" style="display:none;margin-top:14px;border-top:1px solid rgba(255,255,255,.05);padding-top:14px;"></div>'
      + '</div>';

    html += '<div class="vb-actions" style="margin-top:20px">'
      + '  <button class="vb-btn vb-pub" id="pub-pages-links">Publish Pages & Links</button>'
      + '</div>';

    sec.innerHTML = html;

    // Bind events
    document.getElementById('btn-add-nav-link').addEventListener('click', addNavLink);
    document.getElementById('pe-select-page').addEventListener('change', selectPageToEdit);
    document.getElementById('pub-pages-links').addEventListener('click', function() {
      saveCurrentPageEdit();
      Promise.all([
        writeBin('pages', S.pages),
        writeBin('navigation', S.navigation)
      ]).then(function() {
        toast('Pages and navigation published! Live on website.');
      }).catch(function() {
        toast('Failed to publish', 'err');
      });
    });

    renderNavLinkList();
  }

  function renderNavLinkList() {
    var wrap = document.getElementById('vb-nav-list');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (S.navigation.length === 0) {
      wrap.innerHTML = '<p style="font-size:.75rem;color:rgba(255,255,255,.3);text-align:center;margin:10px 0;">No footer links. Add one below.</p>';
      return;
    }

    S.navigation.forEach(function(item, idx) {
      var row = document.createElement('div');
      row.className = 'vb-row';
      row.style.marginBottom = '10px';
      row.style.alignItems = 'center';

      row.innerHTML = 
        '<div class="vb-f" style="margin-bottom:0;flex:2;"><input class="nav-label-input" data-idx="' + idx + '" value="' + esc(item.label) + '" placeholder="Label"></div>'
        + '<div class="vb-f" style="margin-bottom:0;flex:3;"><input class="nav-url-input" data-idx="' + idx + '" value="' + esc(item.url) + '" placeholder="URL (e.g. /coming-soon?page=...)"></div>'
        + '<div class="vb-f" style="margin-bottom:0;flex:1;display:flex;align-items:center;justify-content:center;gap:4px;"><label class="vb-toggle" style="gap:4px;" title="Open in new tab"><input type="checkbox" class="nav-target-input" data-idx="' + idx + '"' + (item.new_tab ? ' checked' : '') + '><span class="vb-ttrack" style="width:36px;height:20px;border-radius:10px;"><span class="vb-tknob" style="width:14px;height:14px;top:3px;left:3px;"></span></span></label></div>'
        + '<button class="vb-btn vb-del btn-del-nav-link" data-idx="' + idx + '" style="padding:8px 12px;height:36px;">✕</button>';

      row.querySelector('.nav-label-input').addEventListener('input', function(e) {
        S.navigation[idx].label = e.target.value;
        renderPreview();
      });
      row.querySelector('.nav-url-input').addEventListener('input', function(e) {
        S.navigation[idx].url = e.target.value;
        renderPreview();
      });
      row.querySelector('.nav-target-input').addEventListener('change', function(e) {
        S.navigation[idx].new_tab = e.target.checked;
        renderPreview();
      });
      row.querySelector('.btn-del-nav-link').addEventListener('click', function() {
        S.navigation.splice(idx, 1);
        renderNavLinkList();
        renderPreview();
      });

      wrap.appendChild(row);
    });
  }

  function addNavLink() {
    S.navigation.push({ label: 'New Link', url: '/coming-soon.html?page=new-page', new_tab: false });
    renderNavLinkList();
    renderPreview();
  }

  function selectPageToEdit(e) {
    saveCurrentPageEdit();

    var val = e.target.value;
    var editorWrap = document.getElementById('pe-page-editor');
    if (!editorWrap) return;

    if (!val) {
      editorWrap.style.display = 'none';
      editingPageSlug = '';
      renderPreview();
      return;
    }

    editorWrap.style.display = 'block';

    if (val === 'new_page') {
      editingPageSlug = '_new_page_temp';
      editorWrap.innerHTML = 
        '<div class="vb-f"><label>Page Title</label><input id="pe-title" value="" placeholder="e.g. Terms of Service"></div>'
        + '<div class="vb-f"><label>Page URL Slug</label><input id="pe-slug" value="" placeholder="e.g. terms-of-service"></div>'
        + '<div class="vb-f"><label>Page Content (HTML/Text)</label><textarea id="pe-content" placeholder="Enter page content here... HTML tags are supported."></textarea></div>'
        + '<div class="vb-actions"><button class="vb-btn vb-pub" id="btn-save-new-page">Create Page</button></div>';

      document.getElementById('btn-save-new-page').addEventListener('click', createNewPage);
    } else {
      editingPageSlug = val;
      var p = S.pages[val];
      editorWrap.innerHTML = 
        '<div class="vb-f"><label>Page Title</label><input id="pe-title" value="' + esc(p.title) + '"></div>'
        + '<div class="vb-f"><label>Page URL Slug (cannot be changed)</label><input id="pe-slug" value="' + val + '" disabled style="opacity:0.5;"></div>'
        + '<div class="vb-f"><label>Page Content (HTML/Text)</label><textarea id="pe-content" style="min-height:250px;">' + esc(p.content) + '</textarea></div>'
        + '<div class="vb-actions"><button class="vb-btn vb-del" id="btn-delete-page">Delete Page</button></div>';

      document.getElementById('btn-delete-page').addEventListener('click', deletePage);

      ['pe-title', 'pe-content'].forEach(function(id) {
        document.getElementById(id).addEventListener('input', function() {
          saveCurrentPageEdit();
          renderPreview();
        });
      });
    }

    renderPreview();
  }

  function saveCurrentPageEdit() {
    if (!editingPageSlug || editingPageSlug === '_new_page_temp') return;
    var titleEl = document.getElementById('pe-title');
    var contentEl = document.getElementById('pe-content');
    if (titleEl && contentEl && S.pages[editingPageSlug]) {
      S.pages[editingPageSlug].title = titleEl.value;
      S.pages[editingPageSlug].content = contentEl.value;
    }
  }

  function createNewPage() {
    var title = document.getElementById('pe-title').value.trim();
    var slug = document.getElementById('pe-slug').value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    var content = document.getElementById('pe-content').value;

    if (!title || !slug) {
      alert('Please enter both a title and a URL slug.');
      return;
    }

    if (S.pages[slug]) {
      alert('A page with this slug already exists.');
      return;
    }

    S.pages[slug] = { title: title, content: content };
    editingPageSlug = slug;
    
    var select = document.getElementById('pe-select-page');
    select.innerHTML = '<option value="">-- Select a Page --</option>';
    Object.keys(S.pages).forEach(function(s) {
      select.innerHTML += '<option value="' + s + '">' + esc(S.pages[s].title) + ' (' + s + ')</option>';
    });
    select.innerHTML += '<option value="new_page">+ Create New Page...</option>';
    select.value = slug;
    
    select.dispatchEvent(new Event('change'));
    toast('Page created! Click Publish to save changes.');
  }

  function deletePage() {
    if (!editingPageSlug) return;
    if (confirm('Are you sure you want to delete this page? This cannot be undone.')) {
      delete S.pages[editingPageSlug];
      editingPageSlug = '';
      renderPagesTab();
      renderPreview();
      toast('Page deleted. Click Publish to save changes.');
    }
  }

  /* ══════════════════════════════════════════════════ */
  /*               LIVE PREVIEW                         */
  /* ══════════════════════════════════════════════════ */
  function renderPreview(){
    var pv = document.getElementById('vb-preview'); if(!pv) return;
    var html = '';

    if(S.tab === 0) {
      /* Listings preview */
      html += '<div class="pvw-section" data-label="Listings — '+(S.cardsTab==='sale'?'For Sale':'For Rent')+'">';
      html += '<div class="pvw-cards">';
      (S.cards[S.cardsTab]||[]).filter(function(c){return c.status==='active'}).forEach(function(c){
        html += '<div class="pvw-card" style="position:relative"><img src="'+(c.image_url||c.images?.[0]||'')+'" onerror="this.style.background=\'#ddd\'"><div class="price-tag">'+esc(c.price)+'</div><div class="pvw-card-body"><h4>'+esc(c.title)+'</h4><p>'+esc(c.lot_type)+' · '+esc(c.sqft)+'</p></div></div>';
      });
      html += '</div></div>';
    }

    if(S.tab === 1) {
      /* Site content preview */
      html += '<div class="pvw-section" data-label="Visit Us">';
      html += '<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:2rem;font-weight:300;color:#1f2937;margin-bottom:20px">Visit <em>Us</em></div>';
      html += '<div class="pvw-contact">';
      html += '<div class="pvw-contact-item"><div class="pvw-contact-label">Address</div><div class="pvw-contact-value">'+(esc(S.site.address_line1)||'—')+'<br>'+(esc(S.site.address_line2)||'')+'</div></div>';
      html += '<div class="pvw-contact-item"><div class="pvw-contact-label">On Site Managers</div><div class="pvw-contact-value">';
      if(S.site.manager_name) html += '<strong>'+esc(S.site.manager_name)+'</strong><br>';
      if(S.site.manager_phone) html += '<a href="tel:'+esc(S.site.manager_phone)+'">'+esc(S.site.manager_phone)+'</a><br>';
      if(S.site.manager_email) html += '<a href="mailto:'+esc(S.site.manager_email)+'">'+esc(S.site.manager_email)+'</a>';
      if(!S.site.manager_name && !S.site.manager_phone) html += '<span style="color:#9ca3af;font-style:italic">Not set — fill in the fields to see preview</span>';
      html += '</div></div></div></div>';
    }

    if(S.tab === 2) {
      /* Alert preview */
      if(S.alert.active) {
        html += '<div class="pvw-alert '+esc(S.alert.severity)+'">';
        html += '<div style="font-size:2rem;margin-bottom:8px">' + (S.alert.severity==='critical'?'[Critical Alert]':'[Warning Alert]') + '</div>';
        html += '<h3>'+esc(S.alert.headline||'Headline...')+'</h3>';
        html += '<p>'+esc(S.alert.message||'Alert message...')+'</p>';
        html += '<div class="dismiss-btn">I Understand</div>';
        html += '</div>';
        html += '<div class="pvw-section" data-label="What visitors will see" style="text-align:center;padding:40px"><p style="color:#6b7280;font-size:.85rem">This alert will appear as a <strong>full-screen overlay</strong> that visitors <strong>must dismiss</strong> before accessing the site.</p></div>';
      } else {
        html += '<div class="pvw-alert off"><h3>No active alert</h3><p style="color:#9ca3af">Toggle the alert ON and enter a headline to see the preview</p></div>';
      }
    }

    if(S.tab === 3) {
      /* Pages & Links preview */
      html += '<div class="pvw-section" data-label="Footer Links Preview">';
      html += '<div style="display:flex;gap:16px;justify-content:center;padding:10px;background:#f3f4f6;border-radius:8px;flex-wrap:wrap;">';
      (S.navigation || []).forEach(function(item) {
        html += '<a href="#" style="font-size:.8rem;color:#1767f6;text-decoration:none;font-weight:500;">' + esc(item.label) + '</a>';
      });
      html += '</div></div>';

      var selectedPageSlug = document.getElementById('pe-select-page') ? document.getElementById('pe-select-page').value : '';
      if (selectedPageSlug && S.pages[selectedPageSlug]) {
        var p = S.pages[selectedPageSlug];
        html += '<div class="pvw-section" data-label="Page Preview: ' + esc(p.title) + '">';
        html += '<h1 style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:2.2rem;font-weight:300;color:#1f2937;margin-bottom:12px;text-align:center;">' + esc(p.title) + '</h1>';
        html += '<div style="font-size:.95rem;line-height:1.6;color:#4b5563;text-align:left;">' + p.content + '</div>';
        html += '</div>';
      }
    }

    pv.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════ */
  /*                   INIT                             */
  /* ══════════════════════════════════════════════════ */
  /* ── Loading Overlay ── */
  var overlay = null;
  var dataLoaded = false;

  function openBuilder() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'vb';
      overlay.id = 'vb-root';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open');

    if (dataLoaded) {
      return;
    }

    showLoadingState();

    Promise.all([readBin('cards'), readBin('site'), readBin('alert'), readBin('pages'), readBin('navigation')])
      .then(function(r) {
        if(r[0]) S.cards = r[0];
        if(r[1]) S.site = r[1];
        if(r[2]) S.alert = r[2];
        if(r[3]) S.pages = r[3];
        if(r[4]) S.navigation = r[4];
        dataLoaded = true;
        
        // Clear loading state and build the full editor UI
        overlay.innerHTML = '';
        buildUI();
      })
      .catch(function(err) {
        console.error('Web Builder load error:', err);
        showErrorState();
      });
  }

  function showLoadingState() {
    overlay.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;">
        <div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#1767f6;border-radius:50%;animation:vbSpin 1s linear infinite;"></div>
        <div style="font-size:0.9rem;color:rgba(255,255,255,0.5);">Loading configuration...</div>
      </div>
      <style>
        @keyframes vbSpin { to { transform: rotate(360deg); } }
      </style>
    `;
  }

  function showErrorState() {
    overlay.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;text-align:center;padding:24px;">
        <div style="font-size:1.1rem;font-weight:600;color:#fff;">Failed to load configuration</div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.4);max-width:320px;line-height:1.5;margin-bottom:8px;">
          Could not retrieve website settings. Please check your connection and try again.
        </div>
        <div style="display:flex;gap:12px;">
          <button class="vb-btn vb-pub" id="wb-retry-btn">Retry</button>
          <button class="vb-btn vb-ghost" id="wb-error-close-btn">Close</button>
        </div>
      </div>
    `;
    document.getElementById('wb-retry-btn').addEventListener('click', function() {
      openBuilder();
    });
    document.getElementById('wb-error-close-btn').addEventListener('click', function() {
      overlay.classList.remove('open');
    });
  }

  /* ── Init ── */
  function init(){
    openBuilder();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
