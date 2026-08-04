/* ═══════════════════════════════════════════════════════════════
 *  Oasis Visual Web Builder
 *  Premium admin panel with live preview, drag-drop, and
 *  WYSIWYG editing. Uses jsonblob.com for global cloud storage.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  var API = '/api/config.php';
  var BINS = {
    cards: 'cards',
    site:  'site',
    alert: 'alert'
  };

  function readBin(id) { return fetch(API+'?key='+id).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}); }
  function writeBin(id, data) { return fetch(API+'?key='+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}); }
  function esc(s) { var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

  /* ── State ── */
  var S = {
    site: {manager_name:'',manager_phone:'',manager_email:'',address_line1:'2615 Lakeshore Dr',address_line2:'Osoyoos, BC V0H 1V6'},
    alert: {active:false,severity:'warning',headline:'',message:''},
    cards: {sale:[],rental:[]},
    tab: 0, cardsTab: 'sale', dirty: {}
  };

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
    .vb-tab .icon{font-size:1rem}

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
    root.innerHTML = '<div class="vb-top"><div class="vb-logo">🏝️ <span>Oasis Web Builder</span></div><div class="vb-top-actions"><span class="vb-saved" id="vb-saved">✓ Saved</span><button class="vb-btn vb-ghost" id="vb-close">Logout ✕</button></div></div>';

    /* ── Tabs ── */
    var tabs = [
      {icon:'📋',label:'Listings'},
      {icon:'🏠',label:'Site Content'},
      {icon:'🚨',label:'Emergency Alert'}
    ];
    var tabBar = document.createElement('div'); tabBar.className = 'vb-tabs';
    tabs.forEach(function(t,i){
      var tb = document.createElement('div'); tb.className = 'vb-tab'+(i===0?' on':''); tb.dataset.idx = i;
      tb.innerHTML = '<span class="icon">'+t.icon+'</span>'+t.label;
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
      ct.textContent = type==='sale'?'🏡 For Sale':'🔑 For Rent';
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

    /* Add New Listing Button */
    var addBtn = document.createElement('button');
    addBtn.className = 'vb-btn vb-ghost';
    addBtn.id = 'wb-add-card-btn';
    addBtn.style.cssText = 'width:100%;margin-top:12px;border:1px dashed rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.5);font-size:0.75rem;font-weight:600;padding:10px;cursor:pointer;border-radius:6px;transition:all 0.2s;';
    addBtn.addEventListener('mouseenter', function(){ this.style.color='#fff'; this.style.borderColor='rgba(255,255,255,0.3)'; });
    addBtn.addEventListener('mouseleave', function(){ this.style.color='rgba(255,255,255,0.5)'; this.style.borderColor='rgba(255,255,255,0.15)'; });
    sec0.appendChild(addBtn);

    /* Edit form (hidden until card selected) */
    var editForm = document.createElement('div'); editForm.id = 'vb-edit-form'; editForm.style.display = 'none';
    sec0.appendChild(editForm);

    /* Publish button */
    sec0.innerHTML += '<div class="vb-actions" style="margin-top:20px"><button class="vb-btn vb-pub" id="pub-cards">✓ Publish Listings</button></div>';

    ed.appendChild(sec0);

    /* ── 2. SITE CONTENT ── */
    var sec1 = document.createElement('div'); sec1.className = 'vb-sec'; sec1.id = 'sec-site';
    sec1.innerHTML = `
      <div class="vb-card"><h3>👤 On Site Managers</h3>
        <div class="vb-f"><label>Manager Name(s)</label><input id="f-mgr-name" type="text" placeholder="e.g. John & Jane Smith"></div>
        <div class="vb-row">
          <div class="vb-f"><label>Phone</label><input id="f-mgr-phone" type="text" placeholder="(250) 495-1234"></div>
          <div class="vb-f"><label>Email</label><input id="f-mgr-email" type="text" placeholder="manager@oasisresort.ca"></div>
        </div>
      </div>
      <div class="vb-card"><h3>📍 Resort Address</h3>
        <div class="vb-f"><label>Street</label><input id="f-addr1" type="text" placeholder="2615 Lakeshore Dr"></div>
        <div class="vb-f"><label>City / Province / Postal</label><input id="f-addr2" type="text" placeholder="Osoyoos, BC V0H 1V6"></div>
      </div>
      <div class="vb-actions"><button class="vb-btn vb-pub" id="pub-site">✓ Publish Site Content</button></div>
    `;
    ed.appendChild(sec1);

    /* ── 3. EMERGENCY ALERT ── */
    var sec2 = document.createElement('div'); sec2.className = 'vb-sec'; sec2.id = 'sec-alert';
    sec2.innerHTML = `
      <div class="vb-card"><h3>🚨 Emergency Alert <span class="badge" id="alert-badge" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.35)">OFF</span></h3>
        <label class="vb-toggle">
          <input type="checkbox" id="f-alert-active">
          <span class="vb-ttrack"></span>
          <span class="vb-tknob"></span>
          <span class="vb-tlabel" id="alert-toggle-label" style="color:rgba(255,255,255,.35)">Alert is OFF</span>
        </label>
        <div style="margin-top:18px">
          <div class="vb-f"><label>Severity</label>
            <select id="f-alert-sev"><option value="warning">⚠️ Warning (Amber)</option><option value="critical">🔴 Critical (Red)</option></select>
          </div>
          <div class="vb-f"><label>Headline</label><input id="f-alert-head" type="text" placeholder="e.g. ⚠️ RESORT CLOSURE NOTICE"></div>
          <div class="vb-f"><label>Message</label><textarea id="f-alert-msg" placeholder="e.g. The Oasis is shut down this weekend due to forest fire warning..."></textarea></div>
        </div>
      </div>
      <div class="vb-actions">
        <button class="vb-btn vb-pub" id="pub-alert">✓ Publish Alert</button>
        <button class="vb-btn vb-del" id="clear-alert">✕ Clear Alert</button>
      </div>
    `;
    ed.appendChild(sec2);

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
      if(badge){badge.textContent=alertActive.checked?'● LIVE':'OFF';badge.style.background=alertActive.checked?'rgba(22,163,74,.2)':'rgba(255,255,255,.06)';badge.style.color=alertActive.checked?'#16a34a':'rgba(255,255,255,.35)'}
      renderPreview();
    });
    ['f-alert-sev','f-alert-head','f-alert-msg'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('input', function(){ syncAlertState(); renderPreview(); });
    });

    /* Publish buttons */
    var pubCards = document.getElementById('pub-cards');
    if(pubCards) pubCards.addEventListener('click', function(){
      writeBin(BINS.cards, S.cards).then(function(){toast('Listings published! Live for all visitors.')}).catch(function(){toast('Failed to publish','err')});
    });

    /* Add Card Button */
    var addCardBtn = document.getElementById('wb-add-card-btn');
    if(addCardBtn) {
      addCardBtn.innerHTML = '➕ Add New Listing';
      addCardBtn.addEventListener('click', function(){
        var arr = S.cards[S.cardsTab];
        if(!arr) { S.cards[S.cardsTab] = []; arr = S.cards[S.cardsTab]; }
        
        var nextId = 1;
        var allCards = (S.cards.sale || []).concat(S.cards.rental || []);
        if(allCards.length > 0) {
          nextId = Math.max.apply(null, allCards.map(function(c){return c.id || 0;})) + 1;
        }
        var isRent = (S.cardsTab === 'rental');
        var newCard = {
          id: nextId,
          lot_number: isRent ? 'Site 300' : 'Lot 300',
          title: isRent ? 'New Rental Site' : 'New Lot for Sale',
          price: isRent ? '$150/night' : '$150,000',
          lot_type: isRent ? 'Full Hook-Up RV Site' : 'Park Model + Arizona Room',
          sqft: '300 sq ft',
          description: 'Enter description here...',
          image_url: '/images/spots/pool.jpg',
          images: ['/images/spots/pool.jpg'],
          status: 'active',
          href: isRent ? 'https://oasisresort.ca/sites-for-rent/' : 'https://oasisresort.ca/sites-for-sale/'
        };
        arr.push(newCard);
        renderListings();
        selectCard(arr.length - 1);
        renderPreview();
        toast('New listing added! Remember to publish.');
      });
    }

    var pubSite = document.getElementById('pub-site');
    if(pubSite) pubSite.addEventListener('click', function(){
      syncSiteState();
      writeBin(BINS.site, S.site).then(function(){toast('Site content published! Live for all visitors.')}).catch(function(){toast('Failed to publish','err')});
    });
    var pubAlert = document.getElementById('pub-alert');
    if(pubAlert) pubAlert.addEventListener('click', function(){
      syncAlertState();
      writeBin(BINS.alert, S.alert).then(function(){toast(S.alert.active?'🚨 Alert is LIVE for all visitors!':'Alert saved (currently OFF).')}).catch(function(){toast('Failed to publish','err')});
    });
    var clearAlert = document.getElementById('clear-alert');
    if(clearAlert) clearAlert.addEventListener('click', function(){
      S.alert = {active:false,severity:'warning',headline:'',message:''};
      populateAlertFields();
      renderPreview();
      writeBin(BINS.alert, S.alert).then(function(){toast('Alert cleared.')}).catch(function(){toast('Failed','err')});
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
    form.innerHTML = '<div class="vb-card"><h3>✏️ Edit — '+esc(card.title)+'</h3>'
      + '<div class="vb-f"><label>Title</label><input id="ce-title" value="'+esc(card.title||'')+'"></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Price</label><input id="ce-price" value="'+esc(card.price||'')+'"></div>'
      + '<div class="vb-f"><label>Lot / Site #</label><input id="ce-lot" value="'+esc(card.lot_number||'')+'"></div></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Type</label><input id="ce-type" value="'+esc(card.lot_type||'')+'"></div>'
      + '<div class="vb-f"><label>Size</label><input id="ce-sqft" value="'+esc(card.sqft||'')+'"></div></div>'
      + '<div class="vb-f"><label>Description</label><textarea id="ce-desc">'+esc(card.description||'')+'</textarea></div>'
      + '<div class="vb-f"><label>Image URL</label><input id="ce-img" value="'+esc(card.image_url||card.images?.[0]||'')+'"></div>'
      + '<div class="vb-row"><div class="vb-f"><label>Status</label><select id="ce-status"><option value="active"'+(card.status==='active'?' selected':'')+'>Active</option><option value="hidden"'+(card.status==='hidden'?' selected':'')+'>Hidden</option></select></div>'
      + '<div class="vb-f"><label>Link URL</label><input id="ce-href" value="'+esc(card.href||'')+'"></div></div>'
      + '</div>'
      + '<div style="margin-top:15px;padding:0 10px;"><button class="vb-btn vb-del" id="ce-delete" style="width:100%;border:none;border-radius:6px;padding:12px;font-weight:600;cursor:pointer;">✕ Delete Listing</button></div>';

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

    /* Bind delete button */
    var delBtn = document.getElementById('ce-delete');
    if(delBtn) {
      delBtn.addEventListener('click', function(){
        if(confirm('Are you sure you want to delete this listing?')) {
          S.cards[S.cardsTab].splice(idx, 1);
          form.style.display = 'none';
          renderListings();
          renderPreview();
          toast('Listing deleted! Remember to publish.');
        }
      });
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
        html += '<div style="font-size:2rem;margin-bottom:8px">'+(S.alert.severity==='critical'?'🚨':'⚠️')+'</div>';
        html += '<h3>'+esc(S.alert.headline||'Headline...')+'</h3>';
        html += '<p>'+esc(S.alert.message||'Alert message...')+'</p>';
        html += '<div class="dismiss-btn">I Understand</div>';
        html += '</div>';
        html += '<div class="pvw-section" data-label="What visitors will see" style="text-align:center;padding:40px"><p style="color:#6b7280;font-size:.85rem">👆 This alert will appear as a <strong>full-screen overlay</strong> that visitors <strong>must dismiss</strong> before accessing the site.</p></div>';
      } else {
        html += '<div class="pvw-alert off"><h3>No active alert</h3><p style="color:#9ca3af">Toggle the alert ON and enter a headline to see the preview</p></div>';
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

    Promise.all([readBin(BINS.cards), readBin(BINS.site), readBin(BINS.alert)])
      .then(function(r) {
        if(r[0]) S.cards = r[0];
        if(r[1]) S.site = r[1];
        if(r[2]) S.alert = r[2];
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
        <div style="font-size:2.5rem;">⚠️</div>
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
