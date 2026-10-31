/* Diyaar Store — app screen mockups for store artwork.
   Each builder returns HTML for one screen at real device px (ctx.w × ctx.h).
   They mirror src/mobile/screens/* (Konsta UI, iOS theme on every device) with demo data.
   Loaded as a classic script so it works over file:// in headless Chrome. */
(function () {
  const OLIVE = '#2B330F';
  const LIME = '#BEFF00';
  const INK = '#1C1C1E';

  // Lucide icon paths (24×24 grid), same icon set as the app (lucide-react)
  const IC = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>',
    pkg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    pkgcheck: '<path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><path d="M3.29 7 12 12l8.71-5"/><path d="M12 22V12"/>',
    pkgplus: '<path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><path d="M3.29 7 12 12l8.71-5"/><path d="M12 22V12"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    note: '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chef: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    bank: '<path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/>',
    up: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  };
  function I(n, s = 20, c = 'currentColor', w = 2, fill = 'none') {
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:block">${IC[n]}</svg>`;
  }
  const stars = (n, s = 13) => Array.from({ length: 5 }, (_, i) => I('star', s, 'none', 0, i < n ? '#ff9500' : 'rgba(0,0,0,.1)')).join('');

  // Category look, same as categoryLook() in src/mobile/ui.tsx
  const LOOK = {
    Breakfast: ['🍳', '#fff6db'], Grill: ['🍖', '#ffece6'], Rice: ['🍚', '#f1f6e6'],
    Wraps: ['🌯', '#fff1e3'], Drinks: ['🧃', '#e8f6ff'], Desserts: ['🍰', '#fdeef6'], All: ['🍽️', '#eef3f2'],
  };
  const px = (v) => (typeof v === 'number' ? v + 'px' : v);
  const tileArt = (cat, w, h, radius, fs, emoji) => {
    const [e, bg] = LOOK[cat] || LOOK.All;
    return `<div style="width:${px(w)};height:${px(h)};border-radius:${radius}px;background:${bg};display:grid;place-items:center;flex-shrink:0;font-size:${fs}px;position:relative">${emoji || e}</div>`;
  };

  /* ---------- System chrome ---------- */
  function statusBar(ctx, dark) {
    const c = dark ? '#fff' : '#0B0D05';
    const sig = `<svg width="18" height="12" viewBox="0 0 18 12" fill="${c}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>`;
    const wifi = `<svg width="17" height="12" viewBox="0 0 17 12" fill="${c}"><path d="M8.5 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2C13.9 1.6 11.3.6 8.5.6S3.1 1.6 1.1 3.6l1.2 1.2C3.9 3.2 6.1 2.3 8.5 2.3z"/><path d="M8.5 5.7c1.5 0 2.8.6 3.8 1.5l1.2-1.2C12.2 4.7 10.4 4 8.5 4S4.8 4.7 3.5 6l1.2 1.2c1-.9 2.3-1.5 3.8-1.5z"/><circle cx="8.5" cy="10" r="1.8"/></svg>`;
    const bat = `<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="${c}" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2.4" fill="${c}"/><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="${c}" opacity=".45"/></svg>`;
    if (ctx.os === 'ios' && !ctx.tablet) {
      return `<div class="sb" style="height:54px;padding:0 30px 0 50px;color:${c}"><span class="t" style="font-size:17px;padding-top:4px">9:41</span><span class="r" style="padding-top:4px">${sig}${wifi}${bat}</span></div>`;
    }
    if (ctx.os === 'ios') {
      return `<div class="sb" style="height:30px;padding:0 22px;color:${c}"><span class="t" style="font-size:13px">9:41&nbsp; Sat 31 Oct</span><span class="r">${wifi}${bat}</span></div>`;
    }
    const aw = `<svg width="15" height="12" viewBox="0 0 16 12" fill="${c}"><path d="M8 12 0 3.2C2.2 1.2 5 0 8 0s5.8 1.2 8 3.2z"/></svg>`;
    const as = `<svg width="13" height="13" viewBox="0 0 12 12" fill="${c}"><path d="M12 0v12H0z"/></svg>`;
    const ab = `<svg width="9" height="14" viewBox="0 0 9 14" fill="${c}"><rect x="2.5" y="0" width="4" height="2" rx=".5"/><rect x="0" y="1.5" width="9" height="12.5" rx="1.8"/></svg>`;
    const h = ctx.tablet ? 30 : 38;
    return `<div class="sb" style="height:${h}px;padding:0 ${ctx.tablet ? 22 : 24}px;color:${c}"><span class="t" style="font-size:14px;font-weight:500">12:30</span><span class="r" style="gap:5px">${aw}${as}${ab}</span></div>`;
  }

  // Bottom bar: Home · Menu · Orders · Products · Earnings (TAB_ORDER in MobileApp.tsx)
  function tabbar(ctx, active, badge = 3) {
    const items = [['grid', 'Home'], ['menu', 'Menu'], ['receipt', 'Orders'], ['pkg', 'Products'], ['wallet', 'Earnings']];
    return `<div class="tb" style="padding-bottom:${ctx.bottom + 4}px">${items
      .map(([ic, l]) => `<div class="it ${l === active ? 'on' : ''}">${I(ic, 26, l === active ? OLIVE : '#8E8E93', l === active ? 2.2 : 1.9)}${l === 'Orders' && badge ? `<span class="badge">${badge}</span>` : ''}${l}</div>`)
      .join('')}</div>`;
  }

  function homebar(ctx, light) {
    return `<div class="homebar ${ctx.os === 'android' ? 'and' : ''} ${light ? 'light' : ''}"></div>`;
  }

  function navbar(ctx, o) {
    return `<div class="nb">
      ${statusBar(ctx)}
      <div class="row1">
        <div style="min-width:80px">${o.back ? `<span class="back">${I('left', 26, OLIVE, 2.4)}${o.back}</span>` : ''}</div>
        ${o.center ? `<div class="ctitle">${o.center}${o.centerSub ? `<small>${o.centerSub}</small>` : ''}</div>` : ''}
        <div style="min-width:80px;display:flex;justify-content:flex-end;color:${OLIVE}">${o.right || ''}</div>
      </div>
      ${o.large ? `<div class="large">${o.large}</div>` : ''}
      ${o.sub ? `<div class="sub">${o.sub}</div>` : ''}
      ${o.extra || ''}
    </div>`;
  }

  const searchField = (ph) => `<div style="margin:2px 16px 8px;height:42px;border-radius:12px;background:rgba(190,255,0,.16);box-shadow:inset 0 0 0 1px rgba(43,51,15,.12);display:flex;align-items:center;gap:8px;padding:0 12px;color:rgba(0,0,0,.45);font-size:16px">${I('search', 19, 'rgba(43,51,15,.7)', 2.2)}${ph}</div>`;

  /* ---------- Screens ---------- */
  const S = {};

  // Home: brand header, live orders, today's business, 7-day chart, new-orders bar
  S.home = (ctx) => {
    const trend = [310, 385, 342, 420, 468, 401, 486];
    const W = 300, H = 70, max = 520, min = 260;
    const pts = trend.map((v, i) => [12 + (i * (W - 24)) / 6, H - ((v - min) / (max - min)) * (H - 8)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = `${line} L ${pts[6][0]} ${H} L ${pts[0][0]} ${H} Z`;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pipe = [
      ['receipt', 'New', 3, '#fff4e0', '#e07b00', true],
      ['pkgcheck', 'Accepted', 2, '#e8f1ff', '#1f6fe5'],
      ['chef', 'Cooking', 4, '#f0eeff', '#5b4ee0'],
      ['bag', 'Ready', 1, '#e8f7ee', '#1a9d4b'],
    ];
    const kpi = (l, v, d) => `<div class="card" style="flex:1;padding:13px 14px">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.4px" class="muted">${l}</div>
        <div class="tab xb" style="font-size:22px;letter-spacing:-.4px;margin-top:3px">${v}</div>
        <div class="row" style="gap:5px;margin-top:6px;font-size:11px" class="muted"><span class="row b" style="gap:2px;background:#e8f7ee;color:#1a9d4b;border-radius:6px;padding:2px 6px">${I('up', 12, '#1a9d4b', 2.6)}${d}</span><span class="muted">vs yesterday</span></div></div>`;
    return `
    <div class="app ${ctx.os}">
      <div style="position:relative;background:linear-gradient(135deg,#3fd0bd,#219186 50%,#0f4f48);color:#fff;padding:0 16px 56px;overflow:hidden;flex-shrink:0">
        <span style="position:absolute;right:-64px;top:-80px;width:224px;height:224px;border-radius:50%;background:rgba(190,255,0,.2);filter:blur(40px)"></span>
        <span style="position:absolute;inset:auto 0 0 0;height:112px;background:linear-gradient(180deg,transparent,rgba(247,249,249,.7) 50%,#F7F9F9)"></span>
        <div style="margin:0 -16px">${statusBar(ctx, true)}</div>
        <div class="rel row" style="align-items:flex-start;gap:12px;margin-top:6px">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.75">Diyaar Store</div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-.4px;margin-top:2px">Open for orders</div>
            <div class="row" style="gap:3px;font-size:13px;font-weight:500;opacity:.88;margin-top:2px">Kulan Café · Hodan ${I('down', 16, '#fff', 2.2)}</div>
          </div>
          <img src="assets/hand-lime.png" style="width:40px;height:40px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3))">
        </div>
        <div class="rel row" style="gap:8px;margin-top:12px;font-size:13px;font-weight:700">
          <span class="row" style="gap:6px;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 10px">${I('clock', 16, '#fff')} 15 min prep</span>
          <span class="row" style="gap:6px;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 10px">${I('star', 16, LIME, 2, LIME)} 4.8</span>
          <span class="row" style="gap:8px;background:rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;margin-left:auto;font-weight:800"><span style="width:8px;height:8px;border-radius:50%;background:${LIME}"></span>Open</span>
        </div>
        <div class="rel row" style="margin-top:12px;height:44px;border-radius:12px;background:#fff;padding:0 14px;gap:10px;color:rgba(0,0,0,.45);font-size:15px;box-shadow:0 6px 20px -8px rgba(15,79,72,.35)">${I('search', 20, 'rgba(0,0,0,.6)')} Search orders, customers…</div>
      </div>
      <div class="rel" style="margin-top:-32px">
        <div style="margin:0 16px;height:${ctx.tablet ? 150 : 118}px;border-radius:16px;overflow:hidden;position:relative;background:linear-gradient(120deg,${OLIVE},#4a5a18);color:#fff;padding:16px 18px;box-shadow:0 8px 24px -12px rgba(43,51,15,.6)">
          <span style="position:absolute;right:-30px;top:-40px;width:180px;height:180px;border-radius:50%;background:${LIME};opacity:.16"></span>
          <span style="position:absolute;right:18px;bottom:6px;font-size:${ctx.tablet ? 78 : 62}px">🛵</span>
          <span class="chip" style="background:${LIME};color:${OLIVE};padding:3px 8px;font-size:11px">YOUR OFFER</span>
          <div style="font-size:20px;font-weight:800;letter-spacing:-.3px;margin-top:8px">Free delivery weekend</div>
          <div style="font-size:13px;opacity:.8;margin-top:2px">On Kulan Café orders over $10</div>
        </div>
        <div class="row" style="justify-content:center;gap:5px;margin-top:8px"><span style="width:16px;height:6px;border-radius:3px;background:${OLIVE}"></span><span style="width:6px;height:6px;border-radius:3px;background:rgba(0,0,0,.15)"></span><span style="width:6px;height:6px;border-radius:3px;background:rgba(0,0,0,.15)"></span></div>

        <div class="secttitle" style="margin-top:16px"><b>Live orders</b><span>See all</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 16px">
          ${pipe.map(([ic, l, n, bg, fg, hot]) => `<div style="position:relative;display:flex;flex-direction:column;align-items:center;border-radius:12px;padding:12px 0;background:${bg};${hot ? `box-shadow:0 0 0 2px ${fg}` : ''}">
            ${hot ? '<span style="position:absolute;top:-8px;background:#e5383b;color:#fff;font-size:9px;font-weight:800;border-radius:4px;padding:0 6px;line-height:16px">NEW</span>' : ''}
            ${I(ic, 20, fg)}<span class="tab xb" style="font-size:24px;line-height:1;margin-top:6px;color:${INK}">${n}</span><span class="b" style="font-size:11px;color:${fg};margin-top:4px">${l}</span></div>`).join('')}
        </div>

        <div class="secttitle" style="margin-top:22px"><b>Today's business</b></div>
        <div class="row" style="gap:8px;padding:0 16px">${kpi('Sales', '$486.50', '18%')}${kpi('Orders', '42', '12%')}</div>
        <div class="card" style="margin:8px 16px 0;padding:13px 14px">
          <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.4px" class="muted">Last 7 days</div>
          <div class="tab xb" style="font-size:22px;letter-spacing:-.4px">$2,812.00</div>
          <svg viewBox="0 0 ${W} ${H + 18}" width="100%" height="${ctx.tablet ? 110 : 84}" preserveAspectRatio="none" style="display:block;margin-top:6px">
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LIME}" stop-opacity=".6"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></linearGradient></defs>
            <path d="${area}" fill="url(#rev)"/><path d="${line}" fill="none" stroke="${OLIVE}" stroke-width="2.5" stroke-linejoin="round"/>
            ${days.map((d, i) => `<text x="${pts[i][0]}" y="${H + 15}" font-size="10" fill="#9a9a9f" text-anchor="middle" font-family="-apple-system,system-ui">${d}</text>`).join('')}
          </svg>
        </div>
      </div>
      <div class="row" style="position:absolute;left:12px;right:12px;bottom:${ctx.bottom + 66}px;z-index:31;gap:12px;background:${OLIVE};color:#fff;border-radius:12px;padding:11px 16px;box-shadow:0 10px 30px -10px rgba(43,51,15,.7)">
        <span style="position:relative;width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.15);display:grid;place-items:center">${I('receipt', 20, '#fff')}<span style="position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;border-radius:10px;background:${LIME};color:${OLIVE};font-size:11px;font-weight:800;display:grid;place-items:center">3</span></span>
        <span style="flex:1;line-height:1.2"><b style="display:block;font-size:15px;font-weight:800">3 new orders</b><span style="font-size:12px;opacity:.8;font-weight:500">Customers are waiting</span></span>
        <span class="xb" style="font-size:15px">Accept →</span>
      </div>
      ${tabbar(ctx, 'Home')}${homebar(ctx)}
    </div>`;
  };

  // Orders: kitchen board with stage tabs and ticket cards
  S.orders = (ctx) => {
    const stages = [['New', 3, '#e07b00', true], ['Accepted', 2, '#1f6fe5'], ['Cooking', 4, '#5b4ee0'], ['Ready', 1, '#1a9d4b']];
    const tabs = `<div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:.5px solid rgba(0,0,0,.1);height:56px">
      ${stages.map(([l, n, c, on]) => `<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:6px">
        <span class="tab xb" style="font-size:22px;line-height:1;color:${on ? c : 'rgba(0,0,0,.3)'}">${n}</span>
        <span class="b" style="font-size:11px;letter-spacing:.4px;text-transform:uppercase;margin-top:4px;color:${on ? 'rgba(0,0,0,.8)' : 'rgba(0,0,0,.4)'}">${l}</span>
        ${on ? `<span style="position:absolute;left:16px;right:16px;bottom:0;height:3px;border-radius:2px;background:${c}"></span>` : ''}</div>`).join('')}</div>`;
    const ticket = (no, type, mins, late, name, total, items, note) => `
      <div style="margin:0 16px 12px;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.05),0 8px 20px -12px rgba(0,0,0,.18)">
        <div class="row" style="gap:8px;padding:10px 16px;background:#fff4e0">
          <span class="tab xb" style="font-size:15px;color:#e07b00">#${no}</span>
          <span class="row" style="gap:4px;font-size:12.5px;font-weight:600;color:rgba(0,0,0,.5)">${I(type === 'Pickup' ? 'store' : 'bike', 14, 'rgba(0,0,0,.5)')}${type}</span>
          <span class="row tab b" style="margin-left:auto;gap:4px;border-radius:11px;padding:0 8px;line-height:22px;font-size:12px;${late ? 'background:#ff3b30;color:#fff' : 'background:rgba(255,255,255,.85);color:rgba(0,0,0,.6)'}">${I('clock', 12, late ? '#fff' : 'rgba(0,0,0,.6)')}${mins}</span>
        </div>
        <div style="position:relative;height:0"><span style="position:absolute;left:-8px;top:-8px;width:16px;height:16px;border-radius:50%;background:#F7F9F9"></span><span style="position:absolute;right:-8px;top:-8px;width:16px;height:16px;border-radius:50%;background:#F7F9F9"></span><span style="position:absolute;left:12px;right:12px;top:0;border-top:2px dashed rgba(0,0,0,.07)"></span></div>
        <div style="padding:12px 16px">
          <div class="row between"><span class="b" style="font-size:16px">${name}</span><span class="tab xb" style="font-size:16px">${total}</span></div>
          <div style="font-size:14px;line-height:1.35;color:rgba(0,0,0,.65);margin-top:4px">${items.map(([q, n]) => `<b style="color:#000">${q}</b> ${n}`).join('<span style="color:rgba(0,0,0,.25)"> · </span>')}</div>
          ${note ? `<div class="row" style="align-items:flex-start;gap:6px;margin-top:8px;border-radius:8px;background:rgba(255,149,0,.1);padding:6px 10px;font-size:13px;font-weight:500;color:#b86400">${I('note', 14, '#b86400')}${note}</div>` : ''}
        </div>
        <div style="padding:0 16px 16px"><div class="btnl" style="height:44px;border-radius:12px;font-size:15px">${I('check', 18, OLIVE, 3)} Accept</div></div>
      </div>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { right: I('history', 24, OLIVE), large: 'Orders', extra: tabs })}
      <div style="padding-top:12px">
        ${ticket('1042', 'Delivery', 'now', false, 'Hodan Ali', '$18.50', [['2', 'Chicken Shawarma'], ['3', 'Sambusa'], ['1', 'Mango Juice']], 'Extra hot sauce please 🌶️')}
        ${ticket('1041', 'Pickup', '2 min', false, 'Abdi Warsame', '$9.00', [['1', 'Bariis Iskukaris'], ['1', 'Fresh Lemon Mint']])}
        ${ticket('1040', 'Delivery', '4 min', true, 'Ayaan Hassan', '$26.25', [['2', 'Beef Suqaar'], ['2', 'Canjeero & Honey'], ['2', 'Shaah Cadeys']])}
      </div>
      ${tabbar(ctx, 'Orders')}${homebar(ctx)}
    </div>`;
  };

  // Order detail: status, items, customer, driver, action bar
  S.detail = (ctx) => {
    const li = (media, title, after, opt = {}) => `<div class="li">${media}<div class="lbody"><span style="font-size:16px;${opt.ts || ''}">${title}${opt.foot ? `<span style="display:block;font-size:13px;color:#c76e00;margin-top:1px">${opt.foot}</span>` : ''}</span>${after ? `<span class="tab" style="font-size:16px;color:${opt.ac || 'rgba(0,0,0,.45)'};white-space:nowrap">${after}</span>` : ''}</div></div>`;
    const qty = (n) => `<span class="tab b" style="min-width:30px;height:28px;border-radius:8px;background:rgba(43,51,15,.1);color:${OLIVE};font-size:13px;display:grid;place-items:center;padding:0 6px">${n}×</span>`;
    const tile = (ic, bg, fg = '#fff') => `<span class="tile" style="background:${bg}">${I(ic, 17, fg, 2.2)}</span>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { back: 'Orders', center: 'ORD-1038', centerSub: 'Cooking' })}
      <div class="col" style="align-items:center;padding:14px 16px 4px;text-align:center">
        <span class="chip" style="background:#f0eeff;color:#5b4ee0;font-size:13px"><span style="width:7px;height:7px;border-radius:50%;background:#5b4ee0"></span>Cooking</span>
        <div class="tab" style="font-size:34px;font-weight:700;letter-spacing:-.6px;margin-top:10px">$24.75</div>
        <div style="font-size:15px" class="muted">Delivery · Today, 12:41 PM</div>
      </div>
      <div class="row" style="align-items:flex-start;gap:8px;margin:14px 16px 0;border-radius:12px;background:rgba(255,149,0,.1);padding:11px 12px;font-size:15px;color:#b86500">${I('msg', 16, '#b86500')}Please ring the bell twice 🔔</div>
      <div class="blocktitle">Items</div>
      <div class="list">
        ${li(qty(2), 'Chicken Shawarma', '$9.00')}
        ${li(qty(1), 'Bariis Iskukaris', '$7.50', { foot: '“No onions”' })}
        ${li(qty(3), 'Sambusa', '$4.50')}
        ${li('<span style="width:30px"></span>', 'Total', '$24.75', { ts: 'font-weight:600', ac: '#000' })}
      </div>
      <div class="blocktitle">Customer</div>
      <div class="list">
        ${li(tile('user', '#007aff'), 'Faadumo Yusuf')}
        ${li(tile('phone', '#34c759'), '+252 61 555 0142', 'Call', { ac: OLIVE })}
        ${li(tile('pin', '#ff3b30'), 'Taleex St, near the blue gate')}
        ${li(tile('card', '#ff9500'), 'Mobile money (EVC)', 'Paid', { ac: '#34c759' })}
      </div>
      <div class="blocktitle">Driver</div>
      <div class="list">${li(tile('bike', LIME, OLIVE), 'Mohamed Ali', 'Call', { ac: OLIVE })}</div>
      <div style="position:absolute;left:0;right:0;bottom:0;z-index:30;background:rgba(250,250,250,.96);border-top:.5px solid rgba(0,0,0,.14);padding:12px 16px ${ctx.bottom + 12}px">
        <div class="btnl" style="background:#34c759;color:#fff">Mark ready</div>
      </div>
      ${homebar(ctx)}
    </div>`;
  };

  // Menu items: search, category rail, product grid, Add item button
  S.products = (ctx) => {
    const cats = [['All', 'All', 48], ['Breakfast', 'Breakfast'], ['Grill', 'Grill'], ['Rice', 'Rice'], ['Wraps', 'Wraps'], ['Drinks', 'Drinks']];
    const rail = `<div class="row" style="gap:8px;padding:10px 12px;border-bottom:1px solid rgba(0,0,0,.06);background:rgba(247,249,249,.95);overflow:hidden">
      ${cats.map(([k, l], i) => `<div class="row" style="flex-shrink:0;height:40px;border-radius:20px;gap:8px;padding:0 14px 0 4px;font-size:14px;${i === 0 ? `background:${LIME};color:${OLIVE};font-weight:700` : 'background:#fff;color:rgba(0,0,0,.7);font-weight:600;box-shadow:0 0 0 1px rgba(0,0,0,.06)'}">${tileArt(k, 32, 32, 16, 16)}${l}</div>`).join('')}</div>`;
    const items = [
      ['Wraps', 'Chicken Shawarma', '$4.50', null, true, null, '🌯'],
      ['Grill', 'Beef Suqaar', '$6.80', '$8.00', true, 15, '🥩'],
      ['Rice', 'Bariis Iskukaris', '$7.50', null, true, null, '🍛'],
      ['Breakfast', 'Canjeero & Honey', '$3.00', null, false, null, '🥞'],
      ['Drinks', 'Fresh Mango Juice', '$2.25', '$2.50', true, 10, '🥭'],
      ['Wraps', 'Sambusa (3 pcs)', '$1.50', null, true, null, '🥟'],
      ['Desserts', 'Xalwo Cake', '$3.50', null, true, null, '🍰'],
      ['Drinks', 'Shaah Cadeys', '$1.00', null, true, null, '🍵'],
      ['Grill', 'Lamb Kebab Plate', '$9.50', null, true, null, '🍢'],
    ];
    const cols = ctx.tablet ? 3 : 2;
    const card = ([cat, name, price, was, on, off, emoji]) => `
      <div class="card" style="padding:8px;display:flex;flex-direction:column">
        <div style="position:relative">${tileArt(cat, '100%', ctx.tablet ? 116 : 96, 12, 46, emoji).replace('position:relative', `position:relative;${on ? '' : 'opacity:.4;filter:grayscale(1)'}`)}
          ${off ? `<span style="position:absolute;left:0;top:0;background:#1f6fe5;color:#fff;font-size:10px;font-weight:800;line-height:18px;padding:0 6px;border-radius:12px 0 8px 0">${off}% OFF</span>` : ''}</div>
        <div style="font-size:11px;font-weight:600;margin-top:8px" class="muted">${cat}</div>
        <div class="b" style="font-size:13px;line-height:1.25;height:34px;${on ? '' : 'color:rgba(0,0,0,.4)'}">${name}</div>
        <div class="row between" style="align-items:flex-end;margin-top:6px">
          <div style="line-height:1.15"><div class="tab xb" style="font-size:14px">${price}</div>${was ? `<div class="tab muted" style="font-size:11px;text-decoration:line-through">${was}</div>` : ''}</div>
          <span style="height:32px;border-radius:8px;padding:0 8px;font-size:11px;font-weight:800;display:grid;place-items:center;${on ? `border:1px solid ${OLIVE};background:rgba(190,255,0,.18);color:${OLIVE}` : 'border:1px solid rgba(0,0,0,.15);background:rgba(0,0,0,.04);color:rgba(0,0,0,.5)'}">${on ? 'In stock' : 'Sold out'}</span>
        </div>
      </div>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { large: 'Menu items', sub: '48 items · 3 sold out', extra: searchField('Search your menu') })}
      ${rail}
      <div style="padding:10px">
        <div class="xb" style="font-size:13px;padding:0 4px 8px">All items <span class="muted" style="font-weight:600">· 48</span></div>
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px">${items.slice(0, ctx.tablet ? 9 : 6).map(card).join('')}</div>
      </div>
      <div class="row" style="position:absolute;right:16px;bottom:${ctx.bottom + 76}px;z-index:31;height:44px;border-radius:12px;background:${LIME};color:${OLIVE};padding:0 16px 0 12px;gap:6px;font-size:15px;font-weight:700;box-shadow:0 8px 20px -8px rgba(43,51,15,.55)">${I('plus', 20, OLIVE, 2.6)}Add item</div>
      ${tabbar(ctx, 'Products')}${homebar(ctx)}
    </div>`;
  };

  // Earnings: payout balance, month KPIs, all-time totals, payout account
  S.earnings = (ctx) => {
    const kpi = (l, v, h) => `<div class="card" style="flex:1;padding:13px 14px"><div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.4px" class="muted">${l}</div><div class="tab xb" style="font-size:22px;letter-spacing:-.4px;margin-top:3px">${v}</div><div style="font-size:11px;margin-top:4px" class="muted">${h}</div></div>`;
    const li = (t, a, bold) => `<div class="li"><div class="lbody"><span style="font-size:16px;${bold ? 'font-weight:600' : ''}">${t}</span><span class="tab" style="font-size:16px;${bold ? 'font-weight:600;color:#000' : 'color:rgba(0,0,0,.45)'}">${a}</span></div></div>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { large: 'Earnings' })}
      <div style="position:relative;margin:8px 16px 0;border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#3d4a14,${OLIVE} 50%,#161a07);color:#fff;padding:20px;box-shadow:0 10px 24px rgba(43,51,15,.25)">
        <span style="position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.1)"></span>
        <span style="position:absolute;right:40px;bottom:-64px;width:128px;height:128px;border-radius:50%;background:rgba(255,255,255,.05)"></span>
        <div class="row" style="gap:8px;font-size:15px;opacity:.9">${I('wallet', 16, '#fff')} Your earnings to be paid</div>
        <div class="tab" style="font-size:40px;font-weight:700;letter-spacing:-.8px;margin-top:4px;color:${LIME}">$1,284.60</div>
        <div style="font-size:14px;opacity:.85">From 312 completed orders, after 10% commission</div>
      </div>
      <div class="row" style="gap:8px;padding:12px 16px 0">${kpi('This month (net)', '$3,960.40', '$4,400.45 sales')}${kpi('Commission', '10%', '$1,120.30 all time')}</div>
      <div class="blocktitle">All time</div>
      <div class="list">${li('Sales', '$11,203.00')}${li('Commission', '−$1,120.30')}${li('You earned', '$10,082.70', true)}</div>
      <div class="blocktitle">Payouts go to</div>
      <div class="list"><div class="li"><span class="tile" style="background:${LIME}">${I('bank', 17, OLIVE, 2.2)}</span><div class="lbody"><span style="font-size:16px">EVC Plus · 61 ••• 4521</span></div></div></div>
      <div class="blockfooter">Diyaar sends your payouts. To change the account, use Settings → Payouts on the Diyaar web panel.</div>
      ${tabbar(ctx, 'Earnings')}${homebar(ctx)}
    </div>`;
  };

  // Reviews: rating summary, filter chips, review cards
  S.reviews = (ctx) => {
    const dist = [[5, 82], [4, 12], [3, 4], [2, 1], [1, 1]];
    const chips = ['All', '5 ★', '4 ★', '3 ★ & below'];
    const review = (n, ini, r, when, text, bg) => `
      <div style="border-radius:16px;border:1px solid rgba(0,0,0,.06);background:#fff;padding:16px">
        <div class="row" style="gap:12px">
          <span class="circle" style="width:40px;height:40px;background:${bg};color:${OLIVE};font-size:14px;font-weight:600">${ini}</span>
          <div style="flex:1"><div style="font-size:15px;font-weight:600">${n}</div><div class="row" style="gap:8px"><span class="row" style="gap:2px">${stars(r, 14)}</span><span style="font-size:12px" class="muted">${when}</span></div></div>
        </div>
        <div style="font-size:15px;line-height:1.38;margin-top:12px">${text}</div>
      </div>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { back: 'Back', large: 'Reviews' })}
      <div class="row" style="gap:20px;margin:8px 16px 0;border-radius:16px;border:1px solid rgba(0,0,0,.06);background:#fff;padding:20px">
        <div style="text-align:center"><div class="tab" style="font-size:44px;font-weight:700;line-height:1;letter-spacing:-1px">4.8</div><div class="row" style="gap:2px;margin-top:8px">${stars(5, 14)}</div><div style="font-size:12px;margin-top:4px" class="muted">1,248 reviews</div></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:5px">${dist.map(([n, p]) => `<div class="row" style="gap:8px;font-size:11px" class="muted"><span style="width:8px;color:rgba(0,0,0,.45)">${n}</span><span style="flex:1;height:6px;border-radius:3px;background:rgba(0,0,0,.05)"><span style="display:block;height:6px;border-radius:3px;background:#ff9500;width:${p}%"></span></span></div>`).join('')}</div>
      </div>
      <div class="row" style="gap:8px;padding:14px 16px 4px">${chips.map((c, i) => `<span class="chip" style="font-size:14px;padding:7px 14px;${i === 0 ? `background:${LIME};color:${OLIVE}` : 'background:#fff;color:rgba(0,0,0,.7);box-shadow:0 0 0 1px rgba(0,0,0,.08)'}">${c}</span>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:8px;padding:8px 16px 0">
        ${review('Faadumo Yusuf', 'FY', 5, '2h ago', 'Best shawarma in Hodan! It arrived hot and so fast 🔥', '#E6FF9E')}
        ${review('Mustafe Omar', 'MO', 5, 'Yesterday', 'The sambusa are amazing and the kids love the mango juice. We order every Friday.', '#FFE4D2')}
        ${review('Ayaan Hassan', 'AH', 4, '2 days ago', 'Delicious bariis and big portions. Will order again!', '#DCF1FF')}
      </div>
      ${tabbar(ctx, '', 0)}${homebar(ctx)}
    </div>`;
  };

  // Opening hours: weekly schedule with toggles and time pills
  S.hours = (ctx) => {
    const days = [
      ['Saturday', '07:00', '23:00', true, true], ['Sunday', '07:00', '23:00', true], ['Monday', '07:00', '23:00', true],
      ['Tuesday', '07:00', '23:00', true], ['Wednesday', '07:00', '23:00', true], ['Thursday', '07:00', '00:00', true], ['Friday', '', '', false],
    ];
    const pill = (t) => `<span class="tab" style="background:rgba(118,118,128,.12);border-radius:8px;padding:6px 11px;font-size:15px;font-weight:500">${t}</span>`;
    return `
    <div class="app ${ctx.os}">
      ${navbar(ctx, { back: 'Back', center: 'Opening Hours', right: '<span style="font-size:17px;font-weight:600">Send</span>' })}
      <div class="blocktitle" style="padding-top:14px">Weekly schedule</div>
      <div class="list">
        ${days.map(([d, o, c, open, today]) => `<div class="li"><div class="lbody" style="padding:11px 0">
          <div><div style="font-size:16px;${today ? 'font-weight:600' : ''}">${d}${today ? `<span style="margin-left:6px;font-size:12px;font-weight:600;color:${OLIVE};background:rgba(190,255,0,.35);border-radius:5px;padding:1px 6px">Today</span>` : ''}</div>
            ${open ? `<div class="row" style="gap:8px;margin-top:8px">${pill(o)}<span class="muted">–</span>${pill(c)}</div>` : '<div class="muted" style="font-size:14px;margin-top:2px">Closed</div>'}</div>
          <span class="toggle ${open ? '' : 'off'}"></span></div></div>`).join('')}
      </div>
      <div class="blockfooter">New hours go to Diyaar for approval. Your store opens and closes automatically, and you can still close it any time from Home.</div>
      ${tabbar(ctx, '', 3)}${homebar(ctx)}
    </div>`;
  };

  window.DiyaarScreens = { S, I };
})();
