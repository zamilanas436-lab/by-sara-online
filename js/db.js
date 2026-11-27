// Shared data layer: Supabase client, live updates, settings defaults, helpers.
(function () {
  const C = window.BSO_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(C.SUPABASE_URL || '') && !/YOUR-/.test(C.SUPABASE_KEY || '');
  const sb = configured
    ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bso_auth' },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

  const DEFAULT_SETTINGS = {
    tagline: 'Fashion Store',
    announcement: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
    currency: '₪',
    categories: ['Dresses', 'Abayas', 'Tops', 'Pants', 'Sets', 'Bags', 'Accessories'],
    about: '',
    delivery: '',
    shop_open: true,
    closed_message: '',
    lang: 'ar',
    order_form: true,
  };
  const withDefaults = (d) => Object.assign({}, DEFAULT_SETTINGS, d || {});

  async function loadProducts() {
    const { data, error } = await sb.from('products').select('*')
      .order('sort', { ascending: true }).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function loadSettings() {
    const { data, error } = await sb.from('settings').select('data').eq('id', 1).maybeSingle();
    if (error) throw error;
    return withDefaults(data && data.data);
  }

  // Calls onChange(table, payload) whenever the owner changes something.
  // Also fires onChange('resync') after the connection comes back, so a
  // phone that slept never shows stale items.
  function subscribe(tables, onChange, onStatus) {
    let ch = null;
    let wasDown = false;
    function connect() {
      ch = sb.channel('live-' + tables.join('-') + '-' + Math.random().toString(36).slice(2, 7));
      tables.forEach((tb) => ch.on('postgres_changes', { event: '*', schema: 'public', table: tb }, (p) => onChange(tb, p)));
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (wasDown) onChange('resync');
          wasDown = false;
          onStatus && onStatus(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          wasDown = true;
          onStatus && onStatus(false);
        }
      });
    }
    connect();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onChange('resync');
    });
    window.addEventListener('online', () => onChange('resync'));
    return () => ch && sb.removeChannel(ch);
  }

  // Shrink a photo in the browser before uploading so the shop loads fast on phones.
  function shrinkImage(file, max = 1400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }
  async function uploadImage(file) {
    const blob = await shrinkImage(file);
    const path = 'p/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9) + '.jpg';
    const { error } = await sb.storage.from('products').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return sb.storage.from('products').getPublicUrl(path).data.publicUrl;
  }
  async function deleteImages(urls) {
    const paths = (urls || []).map((u) => (u.split('/storage/v1/object/public/products/')[1] || '')).filter(Boolean);
    if (paths.length) await sb.storage.from('products').remove(paths);
  }

  function money(n, cur) {
    const v = Number(n || 0);
    const s = v % 1 === 0 ? String(v) : v.toFixed(2);
    return (cur || '₪') + s;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const debounce = (fn, ms) => { let tm; return (...a) => { clearTimeout(tm); tm = setTimeout(() => fn(...a), ms); }; };

  function toast(msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  // Register the offline/installable-app helper.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  window.DB = { sb, configured, DEFAULT_SETTINGS, withDefaults, loadProducts, loadSettings, subscribe, uploadImage, deleteImages };
  window.U = { money, esc, debounce, toast };
})();
