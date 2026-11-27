// Arabic / English text for both pages.
(function () {
  const T = {
    en: {
      dir: 'ltr',
      shop: 'Shop', all: 'All', search: 'Search clothes…', newIn: 'New in', featured: 'Featured',
      sale: 'Sale', soldOut: 'Sold out', inStock: 'In stock', size: 'Size', color: 'Color', qty: 'Qty',
      addToBag: 'Add to bag', added: 'Added to your bag ✓', bag: 'Your bag', emptyBag: 'Your bag is empty',
      total: 'Total', checkout: 'Place order', orderWa: 'Order on WhatsApp', remove: 'Remove',
      name: 'Your name', phone: 'Phone number', address: 'City & address', note: 'Note (optional)',
      sendOrder: 'Send order', orderSent: 'Thank you! Your order was sent. We will contact you soon 💕',
      orderFail: 'Could not send the order. Please try again or message us on WhatsApp.',
      chooseSize: 'Please choose a size', chooseColor: 'Please choose a color',
      noProducts: 'No items here yet — check back soon ✨', closed: 'The shop is closed right now',
      contact: 'Contact us', delivery: 'Delivery', about: 'About us', live: 'Live',
      install: 'Install app', installHelp: 'On iPhone: tap Share ⬆ then “Add to Home Screen”.',
      lang: 'عربي', close: 'Close', details: 'Details', back: 'Back',
      // owner
      owner: 'Owner', ownerTitle: 'Owner dashboard', password: 'Password', email: 'Email', signIn: 'Sign in',
      signOut: 'Sign out', wrongPass: 'Wrong email or password.', products: 'Products', orders: 'Orders',
      settings: 'Store settings', addProduct: 'Add item', editProduct: 'Edit item', save: 'Save', saved: 'Saved ✓ — customers see it now',
      cancel: 'Cancel', del: 'Delete', confirmDel: 'Delete this item? This cannot be undone.',
      pName: 'Name', pDesc: 'Description', pPrice: 'Price', pOld: 'Old price (for sale, optional)',
      pCat: 'Category', pSizes: 'Sizes (comma separated)', pColors: 'Colors (comma separated)',
      pPhotos: 'Photos', addPhotos: 'Add photos', pVisible: 'Show in shop', pStock: 'In stock', pFeatured: 'Featured',
      hidden: 'Hidden', uploading: 'Uploading photos…', viewShop: 'Open shop', items: 'items',
      sTagline: 'Tagline under the logo', sAnnouncement: 'Announcement bar (leave empty to hide)',
      sWhatsapp: 'WhatsApp number (with country code, e.g. 972501234567)', sInstagram: 'Instagram username',
      sTiktok: 'TikTok username', sCurrency: 'Currency symbol', sCategories: 'Categories (one per line)',
      sAbout: 'About the shop', sDelivery: 'Delivery info', sOpen: 'Shop is open', sClosedMsg: 'Message when closed',
      sLang: 'Default language for customers', sOrderForm: 'Customers can send orders through the site',
      noOrders: 'No orders yet', st_new: 'New', st_confirmed: 'Confirmed', st_shipped: 'Shipped', st_done: 'Done', st_cancelled: 'Cancelled',
      newOrder: 'New order!', moveUp: 'Move up', moveDown: 'Move down', notConfigured: 'The store database is not connected yet.',
      stats: 'Live in shop', revenue: 'Orders total', search2: 'Search items…', duplicate: 'Duplicate',
      orderOnWaFrom: 'Hello! I would like to order from By Sara Online:',
    },
    ar: {
      dir: 'rtl',
      shop: 'المتجر', all: 'الكل', search: 'ابحثي عن قطعة…', newIn: 'وصل حديثاً', featured: 'مميز',
      sale: 'تخفيض', soldOut: 'نفدت الكمية', inStock: 'متوفر', size: 'المقاس', color: 'اللون', qty: 'الكمية',
      addToBag: 'أضيفي للسلة', added: 'تمت الإضافة للسلة ✓', bag: 'سلتك', emptyBag: 'السلة فارغة',
      total: 'المجموع', checkout: 'إتمام الطلب', orderWa: 'اطلبي عبر واتساب', remove: 'إزالة',
      name: 'الاسم', phone: 'رقم الهاتف', address: 'المدينة والعنوان', note: 'ملاحظة (اختياري)',
      sendOrder: 'إرسال الطلب', orderSent: 'شكراً لك! تم إرسال طلبك وسنتواصل معك قريباً 💕',
      orderFail: 'تعذّر إرسال الطلب. حاولي مرة أخرى أو راسلينا على واتساب.',
      chooseSize: 'اختاري المقاس', chooseColor: 'اختاري اللون',
      noProducts: 'لا توجد قطع هنا بعد — تابعينا قريباً ✨', closed: 'المتجر مغلق حالياً',
      contact: 'تواصلي معنا', delivery: 'التوصيل', about: 'من نحن', live: 'مباشر',
      install: 'ثبّتي التطبيق', installHelp: 'على الآيفون: اضغطي مشاركة ⬆ ثم «إضافة إلى الشاشة الرئيسية».',
      lang: 'English', close: 'إغلاق', details: 'التفاصيل', back: 'رجوع',
      owner: 'المالكة', ownerTitle: 'لوحة التحكم', password: 'كلمة السر', email: 'البريد', signIn: 'دخول',
      signOut: 'خروج', wrongPass: 'البريد أو كلمة السر غير صحيحة.', products: 'المنتجات', orders: 'الطلبات',
      settings: 'إعدادات المتجر', addProduct: 'إضافة قطعة', editProduct: 'تعديل قطعة', save: 'حفظ', saved: 'تم الحفظ ✓ — الزبائن يرونه الآن',
      cancel: 'إلغاء', del: 'حذف', confirmDel: 'حذف هذه القطعة؟ لا يمكن التراجع.',
      pName: 'الاسم', pDesc: 'الوصف', pPrice: 'السعر', pOld: 'السعر القديم (للتخفيض، اختياري)',
      pCat: 'التصنيف', pSizes: 'المقاسات (افصلي بفاصلة)', pColors: 'الألوان (افصلي بفاصلة)',
      pPhotos: 'الصور', addPhotos: 'إضافة صور', pVisible: 'إظهار في المتجر', pStock: 'متوفر', pFeatured: 'مميز',
      hidden: 'مخفي', uploading: 'جاري رفع الصور…', viewShop: 'فتح المتجر', items: 'قطعة',
      sTagline: 'العبارة تحت الشعار', sAnnouncement: 'شريط الإعلان (اتركيه فارغاً لإخفائه)',
      sWhatsapp: 'رقم واتساب (مع رمز الدولة، مثل 972501234567)', sInstagram: 'اسم المستخدم في إنستغرام',
      sTiktok: 'اسم المستخدم في تيك توك', sCurrency: 'رمز العملة', sCategories: 'التصنيفات (كل تصنيف في سطر)',
      sAbout: 'عن المتجر', sDelivery: 'معلومات التوصيل', sOpen: 'المتجر مفتوح', sClosedMsg: 'رسالة عند الإغلاق',
      sLang: 'اللغة الافتراضية للزبائن', sOrderForm: 'السماح للزبائن بإرسال الطلبات من الموقع',
      noOrders: 'لا توجد طلبات بعد', st_new: 'جديد', st_confirmed: 'مؤكد', st_shipped: 'تم الشحن', st_done: 'مكتمل', st_cancelled: 'ملغي',
      newOrder: 'طلب جديد!', moveUp: 'للأعلى', moveDown: 'للأسفل', notConfigured: 'قاعدة بيانات المتجر غير متصلة بعد.',
      stats: 'معروض في المتجر', revenue: 'مجموع الطلبات', search2: 'ابحثي في القطع…', duplicate: 'نسخ',
      orderOnWaFrom: 'مرحباً! أود الطلب من By Sara Online:',
    },
  };
  const KEY = 'bso_lang';
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  const I18N = {
    get lang() { return lang || 'ar'; },
    hasChoice() { return !!lang; },
    setDefault(l) { if (!lang && T[l]) apply(l, false); },
    set(l) { apply(l, true); },
    t(k) { return (T[I18N.lang] && T[I18N.lang][k]) ?? T.en[k] ?? k; },
  };
  function apply(l, remember) {
    lang = l;
    if (remember) { try { localStorage.setItem(KEY, l); } catch (e) {} }
    document.documentElement.lang = l;
    document.documentElement.dir = T[l].dir;
    document.dispatchEvent(new CustomEvent('langchange'));
  }
  document.documentElement.lang = I18N.lang;
  document.documentElement.dir = T[I18N.lang].dir;
  window.I18N = I18N;
  window.t = I18N.t;
})();
