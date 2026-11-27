// Owner page: add / edit / remove items, prices, photos, orders and store settings.
// Every save goes straight to Supabase; open shop pages update live.
(function () {
  const { money, esc, debounce, toast } = U;
  const $ = (s) => document.querySelector(s);
  const sb = DB.sb;

  let session = null;
  let products = [];
  let settings = DB.withDefaults();
  let orders = [];
  let tab = 'products';
  let q = '';
  let draft = null;          // product being edited
  let draftOriginalImages = [];
  let draftUploads = [];     // photos uploaded while the editor is open
  let settingsDirty = false;
  let unsub = null;
  let seenOrders = null;

  $('#bgLogo').innerHTML = logoSVG({ rim: false });
  $('#badgeLogo').innerHTML = logoSVG();

  function paintTop() {
    $('#langBtn').textContent = t('lang');
    $('#outBtn').textContent = t('signOut');
    $('#outBtn').hidden = !session;
    document.title = 'By Sara Online — ' + t('ownerTitle');
  }
  $('#langBtn').onclick = () => I18N.set(I18N.lang === 'ar' ? 'en' : 'ar');
  $('#outBtn').onclick = async () => { await sb.auth.signOut(); };
  document.addEventListener('langchange', () => { paintTop(); render(); if (draft) renderEditor(); });

  // ───────── sign in ─────────
  function renderLogin(msg) {
    $('#app').innerHTML = `
      <form class="login" id="loginForm">
        <div class="hero-logo">${logoSVG()}</div>
        <h1>${esc(t('ownerTitle'))}</h1>
        <label class="field"><span>${esc(t('email'))}</span>
          <input name="email" type="email" autocomplete="username" required value="${esc((window.BSO_CONFIG || {}).OWNER_EMAIL || '')}"></label>
        <label class="field"><span>${esc(t('password'))}</span>
          <input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn gold" type="submit">${esc(t('signIn'))}</button>
        <div class="err">${esc(msg || '')}</div>
      </form>`;
    $('#loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      e.target.querySelector('button').disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('password')) });
      if (error) renderLogin(t('wrongPass'));
    };
  }

  // ───────── data ─────────
  async function loadOrders() {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) throw error;
    return data || [];
  }
  async function refresh(which) {
    try {
      if (!which || which === 'products' || which === 'resync') products = await DB.loadProducts();
      if (!which || which === 'settings' || which === 'resync') settings = await DB.loadSettings();
      if (!which || which === 'orders' || which === 'resync') {
        orders = await loadOrders();
        const fresh = orders.filter((o) => seenOrders && !seenOrders.has(o.id));
        if (fresh.length) { toast('🛍️ ' + t('newOrder') + ' — ' + fresh[0].customer, 'ok'); ding(); }
        seenOrders = new Set(orders.map((o) => o.id));
      }
      render();
    } catch (e) { console.error(e); toast(e.message || 'Error', 'bad'); }
  }
  const pending = new Set();
  const flush = debounce(() => { const w = [...pending]; pending.clear(); w.forEach((x) => refresh(x)); }, 250);
  function onLive(table) { pending.add(table); flush(); }

  function ding() {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const o = a.createOscillator(), g = a.createGain();
        o.frequency.value = f; o.connect(g); g.connect(a.destination);
        g.gain.setValueAtTime(.0001, a.currentTime + i * .15);
        g.gain.exponentialRampToValueAtTime(.2, a.currentTime + i * .15 + .02);
        g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + i * .15 + .3);
        o.start(a.currentTime + i * .15); o.stop(a.currentTime + i * .15 + .32);
      });
    } catch (e) {}
  }

  // ───────── layout ─────────
  function render() {
    if (!session) return;
    const newCount = orders.filter((o) => o.status === 'new').length;
    if (!$('#tabs')) {
      $('#app').innerHTML = `<div class="tabs" id="tabs"></div><div id="panel"></div>`;
      $('#tabs').onclick = (e) => {
        const b = e.target.closest('.tab'); if (!b) return;
        if (tab === 'settings' && settingsDirty && b.dataset.t !== 'settings' && !confirm('⚠️ ' + t('save') + '?')) return;
        if (b.dataset.t !== 'settings') settingsDirty = false;
        tab = b.dataset.t; render();
      };
    }
    $('#tabs').innerHTML = [['products', '👗 ' + t('products')], ['orders', '🛍️ ' + t('orders')], ['settings', '⚙️ ' + t('settings')]]
      .map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${esc(l)}${k === 'orders' ? `<span class="n">${newCount || ''}</span>` : ''}</button>`).join('')
      + `<a class="tab" href="./" target="_blank" style="text-decoration:none;color:inherit">🛒 ${esc(t('viewShop'))}</a>`;
    if (tab === 'products') renderProducts();
    else if (tab === 'orders') renderOrders();
    else if (!settingsDirty) renderSettings();
  }

  // ───────── products ─────────
  function renderProducts() {
    const list = products.filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q));
    const live = products.filter((p) => p.visible).length;
    const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + Number(o.total || 0), 0);
    $('#panel').innerHTML = `
      <div class="stats">
        <div class="stat"><b>${live}</b><span>${esc(t('stats'))}</span></div>
        <div class="stat"><b>${products.length}</b><span>${esc(t('products'))}</span></div>
        <div class="stat"><b>${orders.length}</b><span>${esc(t('orders'))}</span></div>
        <div class="stat"><b>${money(revenue, settings.currency)}</b><span>${esc(t('revenue'))}</span></div>
      </div>
      <div class="panel">
        <div class="toolbar">
          <input class="search" id="pq" type="search" placeholder="${esc(t('search2'))}" value="${esc(q)}">
          <button class="btn gold" id="addBtn">＋ ${esc(t('addProduct'))}</button>
        </div>
        <div id="plist">${list.length ? list.map(row).join('') : `<p style="text-align:center;color:var(--ink-2);padding:30px 0">${esc(t('noProducts'))}</p>`}</div>
      </div>`;
    $('#pq').oninput = debounce((e) => { q = e.target.value.trim().toLowerCase(); renderProducts(); const i = $('#pq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
    $('#addBtn').onclick = () => openEditor(null);
  }
  function row(p) {
    const img = p.images[0];
    return `<div class="prow" data-id="${p.id}">
      ${img ? `<img class="th" src="${esc(img)}" alt="" loading="lazy">` : `<div class="th"></div>`}
      <div class="t"><b>${esc(p.name || '—')}${p.visible ? '' : `<span class="badge-s">${esc(t('hidden'))}</span>`}${p.featured ? '<span class="badge-s">✨</span>' : ''}</b>
        <small>${money(p.price, settings.currency)}${p.old_price ? ` · <s>${money(p.old_price, settings.currency)}</s>` : ''}${p.category ? ' · ' + esc(p.category) : ''}</small></div>
      <div class="acts">
        <button class="mini ${p.in_stock ? 'on' : 'off'}" data-a="stock">${esc(p.in_stock ? t('inStock') : t('soldOut'))}</button>
        <button class="mini ${p.visible ? 'on' : 'off'}" data-a="vis">${p.visible ? '👁 ' + esc(t('pVisible')) : '🚫 ' + esc(t('hidden'))}</button>
        <button class="mini" data-a="up" title="${esc(t('moveUp'))}">▲</button>
        <button class="mini" data-a="down" title="${esc(t('moveDown'))}">▼</button>
        <button class="mini" data-a="dup">${esc(t('duplicate'))}</button>
        <button class="mini" data-a="edit">✏️ ${esc(t('editProduct'))}</button>
      </div>
    </div>`;
  }
  $('#app').addEventListener('click', async (e) => {
    const b = e.target.closest('.prow [data-a]'); if (!b) return;
    const p = products.find((x) => x.id === b.closest('.prow').dataset.id); if (!p) return;
    const a = b.dataset.a;
    if (a === 'edit') return openEditor(p);
    b.disabled = true;
    try {
      if (a === 'stock') await upd(p.id, { in_stock: !p.in_stock });
      else if (a === 'vis') await upd(p.id, { visible: !p.visible });
      else if (a === 'up' || a === 'down') await move(p, a === 'up' ? -1 : 1);
      else if (a === 'dup') {
        const { id, created_at, updated_at, ...copy } = p;
        const { error } = await sb.from('products').insert({ ...copy, name: p.name + ' (2)', sort: p.sort });
        if (error) throw error;
      }
      await refresh('products');
      toast(t('saved'), 'ok');
    } catch (err) { toast(err.message || 'Error', 'bad'); b.disabled = false; }
  });
  async function upd(id, patch) {
    const { error } = await sb.from('products').update(patch).eq('id', id);
    if (error) throw error;
  }
  async function move(p, dir) {
    const i = products.indexOf(p), j = i + dir;
    if (j < 0 || j >= products.length) return;
    const order = products.slice();
    [order[i], order[j]] = [order[j], order[i]];
    // rewrite the sort numbers of the rows that changed position
    const jobs = order.map((x, k) => (x.sort !== k * 10 ? upd(x.id, { sort: k * 10 }) : null)).filter(Boolean);
    await Promise.all(jobs);
  }

  // ───────── product editor ─────────
  function openEditor(p) {
    draft = p ? JSON.parse(JSON.stringify(p)) : {
      name: '', description: '', price: '', old_price: '', category: settings.categories[0] || '',
      sizes: [], colors: [], images: [], in_stock: true, visible: true, featured: false,
    };
    draftOriginalImages = p ? p.images.slice() : [];
    draftUploads = [];
    renderEditor();
    $('#edOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function readForm() {
    const f = $('#edForm'); if (!f) return;
    const v = (n) => f.elements[n].value;
    const list = (s) => s.split(/[,،\n]/).map((x) => x.trim()).filter(Boolean);
    Object.assign(draft, {
      name: v('name'), description: v('description'), price: v('price'), old_price: v('old_price'),
      category: v('category').trim(), sizes: list(v('sizes')), colors: list(v('colors')),
      visible: f.elements.visible.checked, in_stock: f.elements.in_stock.checked, featured: f.elements.featured.checked,
    });
  }
  function renderEditor() {
    const d = draft;
    $('#edSheet').innerHTML = `
      <button class="x" data-close>×</button>
      <form class="editor" id="edForm">
        <h2>${esc(d.id ? t('editProduct') : t('addProduct'))}</h2>
        <div class="opt-label">${esc(t('pPhotos'))}</div>
        <div class="photos" id="photos">
          ${d.images.map((u, i) => `<div class="photo ${i ? '' : 'cover'}"><img src="${esc(u)}" alt="">
            <button type="button" class="rm" data-rm="${i}">×</button>
            ${i ? `<button type="button" class="cv" data-cv="${i}">★</button>` : ''}</div>`).join('')}
          <label class="add-photo">＋<br>${esc(t('addPhotos'))}<input type="file" id="pick" accept="image/*" multiple hidden></label>
        </div>
        <div id="upMsg" style="font-size:13px;color:var(--ink-2);min-height:18px;margin-top:6px"></div>
        <label class="field"><span>${esc(t('pName'))}</span><input name="name" required maxlength="140" value="${esc(d.name)}"></label>
        <div class="two">
          <label class="field"><span>${esc(t('pPrice'))} (${esc(settings.currency)})</span><input name="price" type="number" inputmode="decimal" min="0" step="0.01" required value="${esc(d.price)}"></label>
          <label class="field"><span>${esc(t('pOld'))}</span><input name="old_price" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(d.old_price ?? '')}"></label>
        </div>
        <label class="field"><span>${esc(t('pCat'))}</span><input name="category" list="cats" value="${esc(d.category)}">
          <datalist id="cats">${settings.categories.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
        <div class="two">
          <label class="field"><span>${esc(t('pSizes'))}</span><input name="sizes" value="${esc(d.sizes.join(', '))}" placeholder="S, M, L, XL"></label>
          <label class="field"><span>${esc(t('pColors'))}</span><input name="colors" value="${esc(d.colors.join(', '))}"></label>
        </div>
        <div class="opts" style="margin-top:-4px">
          ${['S, M, L, XL', 'XS, S, M, L, XL, XXL', '36, 38, 40, 42, 44', 'One size'].map((s) => `<button type="button" class="opt" data-sz="${esc(s)}" style="font-size:13px;padding:5px 10px">${esc(s)}</button>`).join('')}
        </div>
        <label class="field"><span>${esc(t('pDesc'))}</span><textarea name="description" maxlength="3000">${esc(d.description)}</textarea></label>
        <label class="switch"><input type="checkbox" name="visible" ${d.visible ? 'checked' : ''}> ${esc(t('pVisible'))}</label>
        <label class="switch"><input type="checkbox" name="in_stock" ${d.in_stock ? 'checked' : ''}> ${esc(t('pStock'))}</label>
        <label class="switch"><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}> ✨ ${esc(t('pFeatured'))}</label>
        <div class="btn-row">
          <button class="btn gold" type="submit" id="saveBtn">${esc(t('save'))}</button>
          <button class="btn ghost" type="button" data-close>${esc(t('cancel'))}</button>
          ${d.id ? `<button class="btn danger" type="button" id="delBtn">🗑 ${esc(t('del'))}</button>` : ''}
        </div>
      </form>`;
    $('#pick').onchange = (e) => uploadPicked([...e.target.files]);
  }
  async function uploadPicked(files) {
    if (!files.length) return;
    readForm();
    const btn = $('#saveBtn'); btn.disabled = true;
    let done = 0;
    $('#upMsg').textContent = `${t('uploading')} 0/${files.length}`;
    for (const f of files) {
      try {
        const url = await DB.uploadImage(f);
        draft.images.push(url); draftUploads.push(url);
      } catch (err) { toast((err && err.message) || 'Upload error', 'bad'); }
      done++;
      $('#upMsg').textContent = `${t('uploading')} ${done}/${files.length}`;
    }
    renderEditor();
  }
  $('#edSheet').addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { readForm(); draft.images.splice(Number(rm.dataset.rm), 1); renderEditor(); return; }
    const cv = e.target.closest('[data-cv]');
    if (cv) { readForm(); const [u] = draft.images.splice(Number(cv.dataset.cv), 1); draft.images.unshift(u); renderEditor(); return; }
    const sz = e.target.closest('[data-sz]');
    if (sz) { $('#edForm').elements.sizes.value = sz.dataset.sz; return; }
    if (e.target.closest('#delBtn')) {
      if (!confirm(t('confirmDel'))) return;
      try {
        const { error } = await sb.from('products').delete().eq('id', draft.id);
        if (error) throw error;
        await removeUnused(draft.images.concat(draftOriginalImages), draft.id);
        closeEditor(true);
        await refresh('products');
        toast(t('saved'), 'ok');
      } catch (err) { toast(err.message || 'Error', 'bad'); }
      return;
    }
    if (e.target.closest('[data-close]')) closeEditor(false);
  });
  $('#edSheet').addEventListener('submit', async (e) => {
    e.preventDefault();
    readForm();
    const d = draft;
    const num = (x) => (x === '' || x == null ? null : Math.max(0, Number(x)));
    const row = {
      name: d.name.trim(), description: d.description.trim(), price: num(d.price) ?? 0, old_price: num(d.old_price),
      category: d.category, sizes: d.sizes, colors: d.colors, images: d.images,
      visible: d.visible, in_stock: d.in_stock, featured: d.featured,
    };
    const btn = $('#saveBtn'); btn.disabled = true;
    try {
      if (d.id) {
        const { error } = await sb.from('products').update(row).eq('id', d.id);
        if (error) throw error;
      } else {
        row.sort = products.length ? Math.min(...products.map((p) => p.sort)) - 10 : 0;
        const { error } = await sb.from('products').insert(row);
        if (error) throw error;
      }
      const dropped = draftOriginalImages.concat(draftUploads).filter((u) => !d.images.includes(u));
      draftUploads = [];
      closeEditor(true);
      await removeUnused(dropped, d.id);
      await refresh('products');
      toast(t('saved'), 'ok');
    } catch (err) { btn.disabled = false; toast(err.message || 'Error', 'bad'); }
  });
  // delete photos from storage unless another item still uses them
  async function removeUnused(urls, exceptId) {
    const used = new Set(products.filter((p) => p.id !== exceptId).flatMap((p) => p.images));
    const gone = [...new Set(urls)].filter((u) => !used.has(u));
    if (gone.length) await DB.deleteImages(gone).catch(() => {});
  }
  function closeEditor(saved) {
    if (!saved && draftUploads.length) removeUnused(draftUploads, draft && draft.id);
    draft = null; draftUploads = [];
    $('#edOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  $('#edOverlay').addEventListener('click', (e) => { if (e.target.id === 'edOverlay') closeEditor(false); });

  // ───────── orders ─────────
  const STATUSES = ['new', 'confirmed', 'shipped', 'done', 'cancelled'];
  function renderOrders() {
    $('#panel').innerHTML = `<div class="panel">${orders.length ? orders.map((o) => {
      const phone = String(o.phone || '').replace(/[^\d+]/g, '');
      const wa = phone.replace(/\D/g, '');
      return `<div class="order st-${esc(o.status)}" data-id="${o.id}">
        <header>
          <div class="who"><b>${esc(o.customer)}</b><div class="when">${new Date(o.created_at).toLocaleString(I18N.lang === 'ar' ? 'ar' : 'en-GB')}</div></div>
          <div class="price"><span class="now" style="font-size:18px">${money(o.total, settings.currency)}</span></div>
        </header>
        <div class="line" style="margin-top:8px">
          <a class="mini" href="tel:${esc(phone)}">📞 ${esc(o.phone)}</a>
          ${wa ? `<a class="mini" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}">💬 WhatsApp</a>` : ''}
        </div>
        ${o.address ? `<div style="margin-top:8px">📍 ${esc(o.address)}</div>` : ''}
        ${o.note ? `<div style="margin-top:6px;color:var(--ink-2)">📝 ${esc(o.note)}</div>` : ''}
        <ul>${(o.items || []).map((it) => `<li>${esc(it.name)}${it.size ? ' — ' + esc(it.size) : ''}${it.color ? ' — ' + esc(it.color) : ''} × ${Number(it.qty) || 1} · ${money((Number(it.price) || 0) * (Number(it.qty) || 1), settings.currency)}</li>`).join('')}</ul>
        <div class="line">
          <select data-st>${STATUSES.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${esc(t('st_' + s))}</option>`).join('')}</select>
          <span class="spacer"></span>
          <button class="mini off" data-odel>🗑 ${esc(t('del'))}</button>
        </div>
      </div>`;
    }).join('') : `<p style="text-align:center;color:var(--ink-2);padding:30px 0">${esc(t('noOrders'))}</p>`}</div>`;
  }
  $('#app').addEventListener('change', async (e) => {
    const s = e.target.closest('[data-st]'); if (!s) return;
    const id = s.closest('.order').dataset.id;
    const { error } = await sb.from('orders').update({ status: s.value }).eq('id', id);
    if (error) toast(error.message, 'bad'); else { await refresh('orders'); toast(t('saved'), 'ok'); }
  });
  $('#app').addEventListener('click', async (e) => {
    const d = e.target.closest('[data-odel]'); if (!d) return;
    if (!confirm(t('del') + '?')) return;
    const { error } = await sb.from('orders').delete().eq('id', d.closest('.order').dataset.id);
    if (error) toast(error.message, 'bad'); else refresh('orders');
  });

  // ───────── settings ─────────
  function renderSettings() {
    const s = settings;
    const f = (k, label, type = 'text', extra = '') => `<label class="field"><span>${esc(t(label))}</span><input name="${k}" type="${type}" value="${esc(s[k] ?? '')}" ${extra}></label>`;
    const ta = (k, label, val) => `<label class="field"><span>${esc(t(label))}</span><textarea name="${k}">${esc(val ?? s[k] ?? '')}</textarea></label>`;
    $('#panel').innerHTML = `<form class="panel" id="setForm">
      ${f('tagline', 'sTagline')}
      ${f('announcement', 'sAnnouncement')}
      <div class="two">${f('whatsapp', 'sWhatsapp', 'tel', 'inputmode="tel"')}${f('currency', 'sCurrency', 'text', 'maxlength="5"')}</div>
      <div class="two">${f('instagram', 'sInstagram')}${f('tiktok', 'sTiktok')}</div>
      ${ta('categories', 'sCategories', s.categories.join('\n'))}
      ${ta('about', 'sAbout')}
      ${ta('delivery', 'sDelivery')}
      <label class="field"><span>${esc(t('sLang'))}</span><select name="lang">
        <option value="ar" ${s.lang === 'ar' ? 'selected' : ''}>العربية</option><option value="en" ${s.lang === 'en' ? 'selected' : ''}>English</option></select></label>
      <label class="switch"><input type="checkbox" name="order_form" ${s.order_form !== false ? 'checked' : ''}> ${esc(t('sOrderForm'))}</label>
      <label class="switch"><input type="checkbox" name="shop_open" ${s.shop_open !== false ? 'checked' : ''}> ${esc(t('sOpen'))}</label>
      ${f('closed_message', 'sClosedMsg')}
      <div class="btn-row"><button class="btn gold" type="submit">${esc(t('save'))}</button></div>
    </form>`;
    $('#setForm').oninput = () => { settingsDirty = true; };
    $('#setForm').onsubmit = async (e) => {
      e.preventDefault();
      const fm = e.target, v = (n) => fm.elements[n].value.trim();
      const data = {
        tagline: v('tagline'), announcement: v('announcement'), whatsapp: v('whatsapp').replace(/[^\d]/g, ''),
        currency: v('currency') || '₪', instagram: v('instagram').replace(/^@/, ''), tiktok: v('tiktok').replace(/^@/, ''),
        categories: v('categories').split('\n').map((x) => x.trim()).filter(Boolean),
        about: v('about'), delivery: v('delivery'), lang: v('lang'), closed_message: v('closed_message'),
        order_form: fm.elements.order_form.checked, shop_open: fm.elements.shop_open.checked,
      };
      const btn = fm.querySelector('[type=submit]'); btn.disabled = true;
      const { error } = await sb.from('settings').update({ data }).eq('id', 1);
      btn.disabled = false;
      if (error) { toast(error.message, 'bad'); return; }
      settingsDirty = false;
      await refresh('settings');
      toast(t('saved'), 'ok');
    };
  }

  // ───────── start ─────────
  paintTop();
  if (!DB.configured) { $('#app').innerHTML = `<div class="noconf">${esc(t('notConfigured'))}</div>`; return; }
  window.addEventListener('beforeunload', (e) => { if (draftUploads.length || settingsDirty) { e.preventDefault(); e.returnValue = ''; } });

  function onSession(s) {
    const was = !!session;
    session = s;
    paintTop();
    if (s && !was) {
      $('#app').innerHTML = '';
      refresh();
      unsub = DB.subscribe(['products', 'settings', 'orders'], onLive, (on) => $('#liveDot').classList.toggle('on', on));
    } else if (!s) {
      if (unsub) { unsub(); unsub = null; }
      seenOrders = null; orders = []; products = [];
      $('#liveDot').classList.remove('on');
      renderLogin();
    }
  }
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_ev, s) => setTimeout(() => onSession(s), 0));
})();
