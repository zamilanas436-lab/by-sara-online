// Customer page: shows the owner's items and updates live when she changes anything.
(function () {
  const { money, esc, debounce, toast } = U;
  const $ = (s) => document.querySelector(s);

  let products = [];
  let settings = DB.withDefaults();
  let cat = 'all';
  let query = '';
  let stamps = {};          // id -> updated_at, to flash cards the owner just changed
  let openId = null;        // product shown in the sheet
  let pick = { size: null, color: null, qty: 1 };
  let bag = load('bso_bag', []);
  let installEvt = null;

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  const cur = () => settings.currency;
  const visible = () => products.filter((p) => p.visible);
  const byId = (id) => products.find((p) => p.id === id);
  const onSale = (p) => p.old_price && Number(p.old_price) > Number(p.price);
  const waDigits = () => String(settings.whatsapp || '').replace(/\D/g, '');

  // ── logos ──
  $('#bgLogo').innerHTML = logoSVG({ rim: false });
  $('#heroLogo').innerHTML = logoSVG();
  $('#badgeLogo').innerHTML = logoSVG();

  // ── static text ──
  function paintText() {
    $('#langBtn').textContent = t('lang');
    $('#search').placeholder = t('search');
    $('#liveDot').title = t('live');
  }
  $('#langBtn').onclick = () => I18N.set(I18N.lang === 'ar' ? 'en' : 'ar');
  document.addEventListener('langchange', () => { paintText(); renderAll(); if (openId) renderProduct(); if (isOpen('#bagOverlay')) renderBag(); });

  // ── store header / footer from settings ──
  function renderSettings() {
    $('#announce').textContent = settings.announcement || '';
    $('#tagline').textContent = settings.tagline || '';
    const s = [];
    if (waDigits()) s.push(`<a class="pill-btn" target="_blank" rel="noopener" href="https://wa.me/${waDigits()}">💬 WhatsApp</a>`);
    if (settings.instagram) s.push(`<a class="pill-btn" target="_blank" rel="noopener" href="https://instagram.com/${encodeURIComponent(settings.instagram.replace(/^@/, ''))}">📸 Instagram</a>`);
    if (settings.tiktok) s.push(`<a class="pill-btn" target="_blank" rel="noopener" href="https://www.tiktok.com/@${encodeURIComponent(settings.tiktok.replace(/^@/, ''))}">🎵 TikTok</a>`);
    s.push(`<button class="pill-btn" id="installBtn">📲 ${esc(t('install'))}</button>`);
    $('#socials').innerHTML = s.join('');
    $('#installBtn').onclick = install;

    const closed = $('#closed');
    closed.hidden = settings.shop_open !== false;
    closed.firstElementChild.textContent = settings.closed_message || t('closed');

    const boxes = [];
    if (settings.about) boxes.push(`<div class="box"><h3>${esc(t('about'))}</h3><p>${esc(settings.about)}</p></div>`);
    if (settings.delivery) boxes.push(`<div class="box"><h3>${esc(t('delivery'))}</h3><p>${esc(settings.delivery)}</p></div>`);
    const contact = [];
    if (waDigits()) contact.push(`WhatsApp: <a href="https://wa.me/${waDigits()}" target="_blank" rel="noopener">+${waDigits()}</a>`);
    if (settings.instagram) contact.push(`Instagram: @${esc(settings.instagram.replace(/^@/, ''))}`);
    if (contact.length) boxes.push(`<div class="box"><h3>${esc(t('contact'))}</h3><p>${contact.join('<br>')}</p></div>`);
    $('#foot').innerHTML = boxes.join('');
  }

  // ── category chips ──
  function renderChips() {
    const used = new Set(visible().map((p) => p.category).filter(Boolean));
    const cats = settings.categories.filter((c) => used.has(c));
    used.forEach((c) => { if (!cats.includes(c)) cats.push(c); });
    const list = [['all', t('all')]];
    if (visible().some((p) => p.featured)) list.push(['__featured', '✨ ' + t('featured')]);
    if (visible().some(onSale)) list.push(['__sale', '🏷️ ' + t('sale')]);
    cats.forEach((c) => list.push([c, c]));
    if (!list.some(([k]) => k === cat)) cat = 'all';
    $('#chips').innerHTML = list.map(([k, label]) =>
      `<button class="chip ${k === cat ? 'on' : ''}" data-k="${esc(k)}">${esc(label)}</button>`).join('');
  }
  $('#chips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    cat = b.dataset.k; renderChips(); renderGrid();
  };
  $('#search').oninput = debounce((e) => { query = e.target.value.trim().toLowerCase(); renderGrid(); }, 150);

  // ── product grid ──
  function filtered() {
    return visible().filter((p) => {
      if (cat === '__featured' && !p.featured) return false;
      if (cat === '__sale' && !onSale(p)) return false;
      if (cat !== 'all' && !cat.startsWith('__') && p.category !== cat) return false;
      if (query && !(`${p.name} ${p.description} ${p.category} ${(p.colors || []).join(' ')}`.toLowerCase().includes(query))) return false;
      return true;
    });
  }
  function priceHTML(p) {
    return `<div class="price"><span class="now">${money(p.price, cur())}</span>${onSale(p) ? `<span class="was">${money(p.old_price, cur())}</span>` : ''}</div>`;
  }
  function card(p, flash) {
    const img = p.images && p.images[0];
    const tags = [];
    if (onSale(p)) tags.push(`<span class="tag">-${Math.round((1 - p.price / p.old_price) * 100)}%</span>`);
    if (p.featured) tags.push(`<span class="tag gold">✨</span>`);
    return `<button class="card ${flash ? 'flash' : ''}" data-id="${p.id}">
      <div class="ph ${p.in_stock ? '' : 'soldout'}" data-label="${esc(t('soldOut'))}">
        ${tags.join('')}
        ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="noimg">${logoSVG()}</div>`}
      </div>
      <div class="info"><div class="nm">${esc(p.name)}</div>${priceHTML(p)}</div>
    </button>`;
  }
  function renderGrid(changed) {
    const list = filtered();
    $('#grid').innerHTML = list.length
      ? list.map((p) => card(p, changed && changed.has(p.id))).join('')
      : `<div class="empty">${esc(t('noProducts'))}</div>`;
  }
  $('#grid').onclick = (e) => { const c = e.target.closest('.card'); if (c) openProduct(c.dataset.id); };

  function renderAll(changed) { renderSettings(); renderChips(); renderGrid(changed); updateBagCount(); }

  // ── product sheet ──
  function openProduct(id) {
    openId = id;
    pick = { size: null, color: null, qty: 1 };
    const p = byId(id);
    if (p && p.sizes.length === 1) pick.size = p.sizes[0];
    if (p && p.colors.length === 1) pick.color = p.colors[0];
    renderProduct();
    openSheet('#pdOverlay');
    history.replaceState(null, '', '#p=' + id);
  }
  function renderProduct() {
    const p = byId(openId);
    if (!p || !p.visible) { closeSheet('#pdOverlay'); return; }
    const imgs = p.images && p.images.length ? p.images : [];
    const sold = !p.in_stock;
    $('#pdSheet').innerHTML = `
      <button class="x" data-close aria-label="${esc(t('close'))}">×</button>
      <div class="pd">
        <div>
          <div class="gallery" id="gal">${imgs.length ? imgs.map((u) => `<img src="${esc(u)}" alt="">`).join('') : `<div style="width:100%;padding:12%">${logoSVG()}</div>`}</div>
          ${imgs.length > 1 ? `<div class="dots" id="dots">${imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
        </div>
        <div class="pd-body">
          <h2>${esc(p.name)}</h2>
          ${priceHTML(p)}
          <div style="margin-top:6px;font-size:14px;color:${sold ? 'var(--bad)' : 'var(--ok)'}">${esc(sold ? t('soldOut') : t('inStock'))}</div>
          ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
          ${p.sizes.length ? `<div class="opt-label">${esc(t('size'))}</div><div class="opts" data-opt="size">${p.sizes.map((s) => `<button class="opt ${pick.size === s ? 'on' : ''}" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
          ${p.colors.length ? `<div class="opt-label">${esc(t('color'))}</div><div class="opts" data-opt="color">${p.colors.map((s) => `<button class="opt ${pick.color === s ? 'on' : ''}" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
          <div class="opt-label">${esc(t('qty'))}</div>
          <div class="qty"><button data-q="-1">−</button><span>${pick.qty}</span><button data-q="1">+</button></div>
          <div class="btn-row">
            <button class="btn gold" id="addBag" ${sold || settings.shop_open === false ? 'disabled' : ''}>👜 ${esc(t('addToBag'))}</button>
            ${waDigits() && !sold ? `<button class="btn wa" id="waOne">💬 ${esc(t('orderWa'))}</button>` : ''}
          </div>
        </div>
      </div>`;
    const gal = $('#gal');
    if (gal && $('#dots')) gal.onscroll = debounce(() => {
      const i = Math.round(Math.abs(gal.scrollLeft) / gal.clientWidth);
      [...$('#dots').children].forEach((d, j) => d.classList.toggle('on', i === j));
    }, 60);
  }
  $('#pdSheet').onclick = (e) => {
    const p = byId(openId); if (!p) return;
    const o = e.target.closest('.opt');
    if (o) { pick[o.parentElement.dataset.opt] = o.dataset.v; renderProduct(); return; }
    const q = e.target.closest('[data-q]');
    if (q) { pick.qty = Math.max(1, Math.min(20, pick.qty + Number(q.dataset.q))); renderProduct(); return; }
    if (e.target.closest('#addBag')) { if (validPick(p)) { addToBag(p); closeSheet('#pdOverlay'); toast(t('added'), 'ok'); } return; }
    if (e.target.closest('#waOne')) { if (validPick(p)) openWhatsApp([{ p, size: pick.size, color: pick.color, qty: pick.qty }]); return; }
    if (e.target.closest('[data-close]')) closeSheet('#pdOverlay');
  };
  function validPick(p) {
    if (p.sizes.length && !pick.size) { toast(t('chooseSize'), 'bad'); return false; }
    if (p.colors.length && !pick.color) { toast(t('chooseColor'), 'bad'); return false; }
    return true;
  }

  // ── bag ──
  function addToBag(p) {
    const same = bag.find((b) => b.id === p.id && b.size === pick.size && b.color === pick.color);
    if (same) same.qty = Math.min(20, same.qty + pick.qty);
    else bag.push({ id: p.id, size: pick.size, color: pick.color, qty: pick.qty });
    save('bso_bag', bag); updateBagCount();
  }
  function bagLines() {
    return bag.map((b) => ({ ...b, p: byId(b.id) })).filter((l) => l.p && l.p.visible && l.p.in_stock);
  }
  function updateBagCount() {
    const n = bagLines().reduce((a, l) => a + l.qty, 0);
    const el = $('#bagCount'); el.textContent = n || ''; el.dataset.n = n;
  }
  const lineTotal = (lines) => lines.reduce((a, l) => a + Number(l.p.price) * l.qty, 0);
  function renderBag(done) {
    const lines = bagLines();
    if (done) {
      $('#bagSheet').innerHTML = `<button class="x" data-close>×</button><div class="bag done" style="text-align:center;padding-top:40px">
        <div style="width:160px;margin:0 auto 14px">${logoSVG()}</div><h2>${esc(t('orderSent'))}</h2>
        <button class="btn" data-close style="margin-top:14px">${esc(t('back'))}</button></div>`;
      return;
    }
    const allowForm = settings.order_form !== false && settings.shop_open !== false && DB.configured;
    const oldForm = $('#orderForm');
    const typed = oldForm ? Object.fromEntries(new FormData(oldForm)) : null;
    queueMicrotask(() => {
      const f = $('#orderForm');
      if (f && typed) Object.entries(typed).forEach(([k, v]) => { if (f.elements[k]) f.elements[k].value = v; });
    });
    $('#bagSheet').innerHTML =`<button class="x" data-close aria-label="${esc(t('close'))}">×</button>
      <div class="bag">
        <h2>${esc(t('bag'))}</h2>
        ${lines.length ? lines.map((l, i) => `
          <div class="bag-item">
            ${l.p.images[0] ? `<img src="${esc(l.p.images[0])}" alt="">` : `<div class="noimg"></div>`}
            <div><div>${esc(l.p.name)}</div>
              <div class="meta">${[l.size, l.color].filter(Boolean).map(esc).join(' · ')} × ${l.qty}</div>
              <button class="linkbtn" data-rm="${bag.indexOf(bag.find((b) => b.id === l.id && b.size === l.size && b.color === l.color))}">${esc(t('remove'))}</button></div>
            <div class="price"><span class="now">${money(l.p.price * l.qty, cur())}</span></div>
          </div>`).join('') : `<p style="color:var(--ink-2)">${esc(t('emptyBag'))}</p>`}
        ${lines.length ? `
          <div class="total-row"><span>${esc(t('total'))}</span><span>${money(lineTotal(lines), cur())}</span></div>
          ${allowForm ? `<form id="orderForm">
            <label class="field"><span>${esc(t('name'))}</span><input name="customer" required maxlength="120" autocomplete="name"></label>
            <label class="field"><span>${esc(t('phone'))}</span><input name="phone" required maxlength="40" inputmode="tel" autocomplete="tel"></label>
            <label class="field"><span>${esc(t('address'))}</span><input name="address" maxlength="400" autocomplete="street-address"></label>
            <label class="field"><span>${esc(t('note'))}</span><textarea name="note" maxlength="1000"></textarea></label>
            <div class="btn-row"><button class="btn gold" type="submit">${esc(t('sendOrder'))}</button>
            ${waDigits() ? `<button class="btn wa" type="button" id="waBag">💬 ${esc(t('orderWa'))}</button>` : ''}</div>
          </form>` : (waDigits() ? `<div class="btn-row"><button class="btn wa" id="waBag">💬 ${esc(t('orderWa'))}</button></div>` : '')}` : ''}
      </div>`;
  }
  $('#bagBtn').onclick = () => { renderBag(); openSheet('#bagOverlay'); };
  $('#bagSheet').onclick = (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { bag.splice(Number(rm.dataset.rm), 1); save('bso_bag', bag); updateBagCount(); renderBag(); return; }
    if (e.target.closest('#waBag')) { openWhatsApp(bagLines()); return; }
    if (e.target.closest('[data-close]')) closeSheet('#bagOverlay');
  };
  $('#bagSheet').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target; const btn = f.querySelector('[type=submit]');
    const lines = bagLines(); if (!lines.length) return;
    const fd = Object.fromEntries(new FormData(f));
    btn.disabled = true;
    const { error } = await DB.sb.from('orders').insert({
      customer: fd.customer.trim(), phone: fd.phone.trim(), address: (fd.address || '').trim(), note: (fd.note || '').trim(),
      items: lines.map((l) => ({ id: l.id, name: l.p.name, size: l.size, color: l.color, qty: l.qty, price: Number(l.p.price), image: l.p.images[0] || null })),
      total: lineTotal(lines),
    });
    btn.disabled = false;
    if (error) { toast(t('orderFail'), 'bad'); return; }
    bag = []; save('bso_bag', bag); updateBagCount(); renderBag(true);
  });

  function openWhatsApp(lines) {
    const rows = lines.map((l) => `• ${l.p.name}${l.size ? ' — ' + l.size : ''}${l.color ? ' — ' + l.color : ''} × ${l.qty} = ${money(l.p.price * l.qty, cur())}`);
    const total = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
    const msg = `${t('orderOnWaFrom')}\n${rows.join('\n')}\n${t('total')}: ${money(total, cur())}`;
    window.open(`https://wa.me/${waDigits()}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  // ── sheets ──
  const isOpen = (s) => $(s).classList.contains('open');
  function openSheet(s) { $(s).classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSheet(s) {
    $(s).classList.remove('open');
    if (!document.querySelector('.overlay.open')) document.body.style.overflow = '';
    if (s === '#pdOverlay') { openId = null; if (location.hash) history.replaceState(null, '', location.pathname); }
  }
  document.querySelectorAll('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) closeSheet('#' + o.id); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach((o) => closeSheet('#' + o.id)); });

  // ── install as an app (phone & PC) ──
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  async function install() {
    if (installEvt) { installEvt.prompt(); installEvt = null; return; }
    toast(t('installHelp'));
  }

  // ── data + live updates ──
  async function refresh() {
    const [ps, st] = await Promise.all([DB.loadProducts(), DB.loadSettings()]);
    const changed = new Set();
    ps.forEach((p) => { if (stamps[p.id] && stamps[p.id] !== p.updated_at) changed.add(p.id); });
    const firstLoad = !Object.keys(stamps).length && !products.length;
    stamps = Object.fromEntries(ps.map((p) => [p.id, p.updated_at]));
    products = ps; settings = st;
    if (firstLoad) I18N.setDefault(settings.lang);
    paintText();
    renderAll(changed);
    if (openId) renderProduct();
    if (isOpen('#bagOverlay') && $('#bagSheet').querySelector('.bag:not(.done)') &&!document.activeElement.closest?.('#orderForm')) renderBag();
    if (firstLoad) {
      const m = location.hash.match(/^#p=(.+)$/);
      if (m && byId(m[1])) openProduct(m[1]);
    }
  }
  const refreshSoon = debounce(() => refresh().catch(() => {}), 250);

  paintText();
  if (!DB.configured) {
    renderAll();
    $('#grid').innerHTML = `<div class="empty">${esc(t('notConfigured'))}</div>`;
    return;
  }
  refresh().catch((e) => { console.error(e); $('#grid').innerHTML = `<div class="empty">${esc(t('noProducts'))}</div>`; });
  DB.subscribe(['products', 'settings'], refreshSoon, (on) => $('#liveDot').classList.toggle('on', on));
})();
