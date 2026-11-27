// The "Fashion STORE · by sara online" badge, drawn as SVG so it stays sharp
// at any size (header, giant background, app icon).
(function () {
  let n = 0;
  function logoSVG(opts = {}) {
    const id = 'lg' + (++n);
    const rim = opts.rim !== false;
    return `
<svg class="logo-svg" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fashion Store by sara online">
  <defs>
    <clipPath id="${id}c"><circle cx="300" cy="300" r="296"/></clipPath>
    <radialGradient id="${id}bg" cx="40%" cy="35%" r="75%">
      <stop offset="0" stop-color="#fbf3f3"/>
      <stop offset=".55" stop-color="#f4e3e4"/>
      <stop offset="1" stop-color="#ead2d5"/>
    </radialGradient>
    <filter id="${id}vein" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.016" numOctaves="5" seed="11" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .55  0 0 0 0 .47  0 0 0 0 .5  1 0 0 0 0" result="a"/>
      <feComponentTransfer in="a"><feFuncA type="table" tableValues="0 0 0 0 .55 0 0 0 0 0"/></feComponentTransfer>
      <feGaussianBlur stdDeviation=".7"/>
    </filter>
    <filter id="${id}cloud" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="3" seed="4"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .86  0 0 0 0 .66  0 0 0 0 .7  1.3 0 0 0 -.62"/>
    </filter>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a87a2a"/>
      <stop offset=".3" stop-color="#e9c97a"/>
      <stop offset=".5" stop-color="#fbe7a6"/>
      <stop offset=".7" stop-color="#c99a3e"/>
      <stop offset="1" stop-color="#8e6420"/>
    </linearGradient>
    <linearGradient id="${id}rose" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d7a1a8"/>
      <stop offset=".5" stop-color="#c0808b"/>
      <stop offset="1" stop-color="#a6646f"/>
    </linearGradient>
    <linearGradient id="${id}wing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6d6dc"/>
      <stop offset="1" stop-color="#d79aa6"/>
    </linearGradient>
    <linearGradient id="${id}bag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0d28a"/>
      <stop offset=".55" stop-color="#c79a45"/>
      <stop offset="1" stop-color="#93682a"/>
    </linearGradient>
    <filter id="${id}sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#6b4a2a" flood-opacity=".25"/>
    </filter>
  </defs>

  <g clip-path="url(#${id}c)">
    <rect width="600" height="600" fill="url(#${id}bg)"/>
    <rect width="600" height="600" filter="url(#${id}cloud)" opacity=".35"/>
    <rect width="600" height="600" filter="url(#${id}vein)" opacity=".55"/>
  </g>
  ${rim ? `<circle cx="300" cy="300" r="295" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
  <circle cx="300" cy="300" r="298" fill="none" stroke="#c9a3a7" stroke-opacity=".35" stroke-width="2"/>` : ''}

  <!-- Fashion -->
  <text x="282" y="262" text-anchor="middle" font-family="'Great Vibes','Parisienne',cursive" font-size="150"
        fill="url(#${id}gold)" filter="url(#${id}sh)">Fashion</text>

  <!-- butterfly -->
  <g transform="translate(452 168) rotate(12)" filter="url(#${id}sh)">
    <path d="M0 6 C -10 -40, -48 -56, -52 -30 C -55 -12, -30 2, -2 10 Z" fill="url(#${id}wing)" stroke="url(#${id}gold)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M2 8 C 26 -44, 64 -48, 58 -18 C 54 2, 26 10, 4 12 Z" fill="url(#${id}wing)" stroke="url(#${id}gold)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-1 12 C -24 18, -38 34, -26 46 C -14 54, -4 34, 0 16 Z" fill="url(#${id}wing)" stroke="url(#${id}gold)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M3 13 C 26 18, 44 34, 32 46 C 20 54, 8 34, 3 16 Z" fill="url(#${id}wing)" stroke="url(#${id}gold)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M1 -2 L 2 40" stroke="url(#${id}gold)" stroke-width="4" stroke-linecap="round"/>
    <path d="M1 -2 C -4 -16, -10 -22, -16 -24 M1 -2 C 6 -16, 12 -22, 18 -23" fill="none" stroke="url(#${id}gold)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-38 -28 C -28 -26, -16 -14, -6 2 M44 -22 C 32 -18, 20 -6, 8 6" fill="none" stroke="#c99a3e" stroke-opacity=".55" stroke-width="1.6"/>
  </g>

  <!-- STORE -->
  <text x="300" y="352" text-anchor="middle" font-family="'Playfair Display','Cormorant Garamond',Georgia,serif" font-size="76"
        font-weight="500" letter-spacing="3" fill="url(#${id}rose)" filter="url(#${id}sh)">STORE</text>

  <!-- by sara online -->
  <text x="300" y="458" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-style="italic" font-weight="600"
        font-size="40" fill="#3c2b2e">by sara online</text>

  <!-- bags -->
  ${[115, 485].map((x, i) => `
  <g transform="translate(${x} 450) rotate(${i ? 6 : -4})" filter="url(#${id}sh)">
    <path d="M-15 -26 C -15 -46, 15 -46, 15 -26" fill="none" stroke="#7c5620" stroke-width="3.5"/>
    <path d="M-27 -26 L 27 -26 L 31 34 L -31 34 Z" fill="url(#${id}bag)"/>
    <path d="M-27 -26 L 27 -26 L 25 -18 L -25 -18 Z" fill="#fff" opacity=".25"/>
    <circle cx="-15" cy="-18" r="2.6" fill="#6e4c1c"/><circle cx="15" cy="-18" r="2.6" fill="#6e4c1c"/>
  </g>`).join('')}
</svg>`;
  }
  window.logoSVG = logoSVG;
})();
