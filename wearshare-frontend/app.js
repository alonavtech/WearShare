/* ================= backend ================= */
const aiName = () => window.CS_AI_NAME || 'AI';
const API_URL = (window.CLOSETSHARE_API || '').replace(/\/$/, '');

/* ================= utilities ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const TODAY = iso(new Date());
const fmt = s => parseISO(s).toLocaleDateString('en-US', { month:'short', day:'numeric' });
const fmtLong = s => parseISO(s).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
const drange = (a, b) => a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5) + 1;
const overlaps = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2;
const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function earliestStart() {
  const d = new Date(Date.now() + 24 * 3600e3);
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (e < d) e.setDate(e.getDate() + 1);
  return iso(e);
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3200); }

/* ================= reference data ================= */
const TYPES = ['Dress','Top','Sweater','Jacket','Pants','Skirt','Shoes','Bag'];
const STYLES = ['Casual','Going out','Formal','Business','Cozy','Sporty','Streetwear','Vintage','Boho','Edgy'];
const SIZES = ['XS','S','M','L','XL','OS','6','7','8','9','26','27','28','30'];
const COLORS = { Black:'#232329', White:'#F5F5F2', Cream:'#EFE6D2', Beige:'#D6BE98', Brown:'#7A5236', Red:'#C8332F', Pink:'#F2A2B8',
  Orange:'#E8833A', Yellow:'#F2C94C', Green:'#4E8F5A', Olive:'#7C7F3E', Blue:'#3D6FD1', Navy:'#24335E', Denim:'#5876A8', Purple:'#8160C4', Gray:'#9AA0A6' };
const CARE = { wash:'Wash before returning', owner:"Return as is, I'll wash it", dry:'Dry clean only' };
const HUES = ['#2F4DD3','#D9466E','#1E8A5A','#A86A12','#7A4CC2','#0F8A9C','#C2410C'];

/* ================= garment illustrations ================= */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function garmentSVG(type, colorName) {
  const c = COLORS[colorName] || '#9AA0A6', light = ['White','Cream','Beige','Yellow'].includes(colorName);
  const s = light ? '#A9A396' : shade(c, .62), sw = 'stroke="' + s + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const P = {
    Top: `<path d="M70 52 L55 57 L25 87 L45 112 L60 100 L60 212 L140 212 L140 100 L155 112 L175 87 L145 57 L130 52 Q100 74 70 52Z" fill="${c}" ${sw}/>`,
    Sweater: `<path d="M70 50 L55 55 L32 100 L24 200 L44 204 L60 120 L60 214 L140 214 L140 120 L156 204 L176 200 L168 100 L145 55 L130 50 Q100 70 70 50Z" fill="${c}" ${sw}/><path d="M62 204 H138 M26 192 L45 195 M155 195 L174 192" ${sw} fill="none"/>`,
    Dress: `<path d="M80 34 L82 76 Q76 96 72 106 L40 214 Q100 228 160 214 L128 106 Q124 96 118 76 L120 34 L110 34 Q100 54 90 34Z" fill="${c}" ${sw}/><path d="M82 34 L86 20 M118 34 L114 20" ${sw} fill="none"/><path d="M76 104 Q100 112 124 104" ${sw} fill="none"/>`,
    Jacket: `<path d="M70 42 L50 49 L28 97 L22 207 L44 210 L58 122 L58 216 L142 216 L142 122 L156 210 L178 207 L172 97 L150 49 L130 42 L100 97Z" fill="${c}" ${sw}/><path d="M70 42 L86 110 L100 97 M130 42 L114 110 L100 97 M100 97 V216" ${sw} fill="none"/><circle cx="108" cy="140" r="3" fill="${s}"/><circle cx="108" cy="172" r="3" fill="${s}"/>`,
    Pants: `<path d="M64 40 L136 40 L148 216 L112 216 L100 100 L88 216 L52 216Z" fill="${c}" ${sw}/><path d="M64 54 H136 M100 54 V100" ${sw} fill="none"/>`,
    Skirt: `<path d="M68 70 L132 70 L166 204 Q100 218 34 204Z" fill="${c}" ${sw}/><path d="M68 84 H132 M86 84 L74 208 M114 84 L126 208" ${sw} fill="none" opacity=".6"/>`,
    Shoes: `<path d="M28 168 Q32 124 70 118 L112 134 Q144 144 172 154 Q184 170 174 186 L28 186Z" fill="${c}" ${sw}/><path d="M28 186 H174 V196 H28Z" fill="#FFFFFF" ${sw}/><path d="M78 126 L92 142 M90 130 L104 146 M102 134 L116 150" ${sw} fill="none"/>`,
    Bag: `<path d="M76 104 Q76 52 100 52 Q124 52 124 104" fill="none" stroke="${s}" stroke-width="7" stroke-linecap="round"/><path d="M46 100 L154 100 L164 212 L36 212Z" fill="${c}" ${sw}/><path d="M60 124 H140" ${sw} fill="none" opacity=".5"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><defs><pattern id="pd" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.5" fill="#F6D3E1"/></pattern></defs><rect width="200" height="250" fill="#FFF7FA"/><rect width="200" height="250" fill="url(#pd)"/><ellipse cx="100" cy="226" rx="66" ry="7" fill="#000" opacity=".07"/>${P[type] || P.Top}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const photoOf = it => it.photo || garmentSVG(it.type, it.color);


/* ================= boutique decorations (original drawings) ================= */
const svgURI = svg => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
const svgSrc = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
function armoireHTML(items) {
  const isShelf = i => i.type === 'Shoes' || i.type === 'Bag';
  const hang = items.filter(i => !isShelf(i)), shelf = items.filter(isShelf);
  return `<div class="armoire">${hang.length ? `<p class="zone-label">Hanging</p><div class="items hanging">${hang.map(i => itemCard(i, false)).join('')}</div>` : ''}
    ${shelf.length ? `<p class="zone-label">Shoes &amp; bags</p><div class="items shelved">${shelf.map(i => itemCard(i, false)).join('')}</div>` : ''}</div>`;
}
function cabinetSVG() {
  const G = '#C9A45C';
  return svgSrc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 190">
  <defs><pattern id="lace" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.3" fill="#D6E4EC"/><circle cx="0" cy="0" r=".8" fill="#D6E4EC"/></pattern></defs>
  <path d="M12 42 C12 24 38 20 52 13 C60 3 80 3 88 13 C102 20 128 24 128 42 Z" fill="#F7D6DC" stroke="${G}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M30 36 C40 30 50 28 58 22 M110 36 C100 30 90 28 82 22" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="70" cy="22" r="6" fill="#EE9FB4" stroke="${G}" stroke-width="1.5"/><path d="M62 26 q-6 2 -8 -2 M78 26 q6 2 8 -2" stroke="#8DB98D" stroke-width="2" fill="none" stroke-linecap="round"/>
  <rect x="14" y="42" width="112" height="118" rx="4" fill="#F7D6DC" stroke="${G}" stroke-width="2.5"/>
  <path d="M22 124 V62 Q22 50 34 50 H58 Q68 50 68 62 V124Z" fill="#CFE3EE" stroke="${G}" stroke-width="2.5"/>
  <path d="M28 120 V64 Q28 56 36 56 H56 Q62 56 62 64 V120Z" fill="#F7FAFB"/><path d="M28 120 V64 Q28 56 36 56 H56 Q62 56 62 64 V120Z" fill="url(#lace)"/>
  <path d="M72 124 V62 Q72 50 82 50 H106 Q118 50 118 62 V124Z" fill="#CFE3EE" stroke="${G}" stroke-width="2.5"/>
  <path d="M78 120 V64 Q78 56 84 56 H104 Q112 56 112 64 V120Z" fill="#F7FAFB"/><path d="M78 120 V64 Q78 56 84 56 H104 Q112 56 112 64 V120Z" fill="url(#lace)"/>
  <circle cx="65" cy="92" r="2.6" fill="${G}"/><circle cx="75" cy="92" r="2.6" fill="${G}"/>
  <rect x="22" y="130" width="46" height="22" rx="3" fill="#FBF0D9" stroke="${G}" stroke-width="2"/><rect x="72" y="130" width="46" height="22" rx="3" fill="#FBF0D9" stroke="${G}" stroke-width="2"/>
  <circle cx="45" cy="141" r="4.5" fill="#EE9FB4"/><circle cx="38" cy="142" r="2.6" fill="#F5BFCD"/><path d="M50 143 q5 1 7 -2 M33 144 q-5 1 -6 -2" stroke="#8DB98D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="95" cy="141" r="4.5" fill="#EE9FB4"/><circle cx="102" cy="142" r="2.6" fill="#F5BFCD"/><path d="M90 143 q-5 1 -7 -2 M107 144 q5 1 6 -2" stroke="#8DB98D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M16 160 Q14 176 24 182 Q28 172 34 160Z" fill="#F7D6DC" stroke="${G}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M124 160 Q126 176 116 182 Q112 172 106 160Z" fill="#F7D6DC" stroke="${G}" stroke-width="2" stroke-linejoin="round"/>
  </svg>`);
}
(function setDecor() {
  const P = '#7A3D63', W = '#EBA6C6', W2 = '#C77AA3', root = document.documentElement.style;
  root.setProperty('--crown', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64"><path d="M8 62 C8 44 44 40 66 32 C88 24 102 6 150 6 C198 6 212 24 234 32 C256 40 292 44 292 62 Z" fill="${W}" stroke="${P}" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 52 C70 47 92 32 114 27 M260 52 C230 47 208 32 186 27" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M60 58 q-8 -10 2 -14 q8 -2 8 6 M240 58 q8 -10 -2 -14 q-8 -2 -8 6" fill="none" stroke="${P}" stroke-width="2" stroke-linecap="round"/><circle cx="150" cy="31" r="14" fill="#FFF9F3" stroke="${P}" stroke-width="2.5"/><path d="M150 39 c-6 -4 -9 -7 -9 -10.5 a4.5 4.5 0 0 1 9 -1.5 a4.5 4.5 0 0 1 9 1.5 c0 3.5 -3 6.5 -9 10.5z" fill="#E0559A"/></svg>`));
  const leg = `<path d="M3 0 H33 Q33 14 24 20 Q19 24 21 32 Q11 32 11 23 Q11 12 3 8Z" fill="${W}" stroke="${P}" stroke-width="2.2" stroke-linejoin="round"/>`;
  root.setProperty('--leg', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 34">${leg}</svg>`));
  root.setProperty('--legr', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 34"><g transform="translate(36 0) scale(-1 1)">${leg}</g></svg>`));
  root.setProperty('--hanger', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 32"><path d="M25 13 C25 9 29.5 9 29.5 5 A4.5 4.5 0 0 0 20.5 5" fill="none" stroke="${P}" stroke-width="2.2" stroke-linecap="round"/><path d="M25 13 L4 27 Q2 29.5 5.5 29.5 H44.5 Q48 29.5 46 27 Z" fill="none" stroke="${P}" stroke-width="2.2" stroke-linejoin="round"/></svg>`));
  let d = 'M0 0 H400 V16'; const n = 8, w = 400 / n;
  for (let i = n; i > 0; i--) d += ` Q${i * w - w / 2} 54 ${(i - 1) * w} 16`;
  let tassels = ''; for (let i = 1; i < n; i++) tassels += `<path d="M${i * w} 16 V28" stroke="#C9A45C" stroke-width="1.5"/><path d="M${i * w - 3} 28 h6 l2 10 h-10z" fill="#C9A45C"/>`;
  root.setProperty('--valance', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="${d}Z" fill="#E98DB8" stroke="#C9A45C" stroke-width="2"/><rect width="400" height="9" fill="#D9739F"/>${tassels}</svg>`));
  root.setProperty('--drape', svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 400" preserveAspectRatio="none"><path d="M0 0 H80 C70 80 42 180 30 240 C40 300 60 360 72 400 H0Z" fill="#F2A7C8"/><path d="M18 0 C16 100 13 200 12 240 M44 0 C38 100 26 200 22 240 M64 0 C56 90 40 190 28 240 M12 250 C14 320 18 370 20 400 M24 250 C32 320 42 370 50 400" stroke="#E07FAE" stroke-width="3" fill="none"/><path d="M30 0 C28 100 20 200 17 240" stroke="#FBD3E5" stroke-width="2" fill="none"/><ellipse cx="22" cy="244" rx="16" ry="5" fill="#C9A45C"/><path d="M34 246 V268" stroke="#C9A45C" stroke-width="1.5"/><path d="M30 268 h8 l3 16 h-14z" fill="#C9A45C"/></svg>`));
})();

/* ================= state ================= */
const KEY = 'closetshare-demo-v1';
let DB = null;
let view = { tab:'closet', user:null, group:null, conv:null, reqTab:'received', explore:'clothes' };
let F = { q:'', type:'', size:'', color:'', style:'', date:'' };
let people = '';
let cal = { y:0, m:0 }, sel = { start:null, end:null };
let ed = null, shareCtx = null, deleteArmed = false, resetArmed = false;
const save = () => { if (window.CS_LIVE) return; try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };
const load = () => { try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } };

function seed() {
  const D = n => addDays(TODAY, n);
  const users = {
    me:     { id:'me',     name:'Alex Nguyen',  username:'alex.n',    hue:HUES[0] },
    maya:   { id:'maya',   name:'Maya Chen',    username:'mayachen',  hue:HUES[1] },
    jordan: { id:'jordan', name:'Jordan Lee',   username:'jlee',      hue:HUES[2] },
    priya:  { id:'priya',  name:'Priya Patel',  username:'priyap',    hue:HUES[3] },
    sam:    { id:'sam',    name:'Sam Rivera',   username:'samr',      hue:HUES[4] },
    ava:    { id:'ava',    name:'Ava Brooks',   username:'avabrooks', hue:HUES[5] },
    leo:    { id:'leo',    name:'Leo Kim',      username:'leokim',    hue:HUES[6] },
  };
  const it = (id, owner, title, type, color, brand, size, style, desc, care, friends, groups, from = -30, to = 60) =>
    ({ id, owner, title, type, color, brand, size, style, desc, care, friends, groups, photo:null, availFrom:D(from), availTo:D(to) });
  return {
    signedIn:false, viewer:'me', users,
    friendships:[
      { a:'me', b:'maya', status:'accepted' }, { a:'me', b:'jordan', status:'accepted' },
      { a:'maya', b:'jordan', status:'accepted' }, { a:'leo', b:'me', status:'pending' },
    ],
    groups:[
      { id:'g_hume', name:'hume 3rd floor', owner:'maya', token:'HUME-3F-7Q2', members:[{uid:'maya',status:'approved'},{uid:'me',status:'approved'},{uid:'priya',status:'approved'},{uid:'sam',status:'approved'}] },
      { id:'g_sigma', name:'SLS fam', owner:'me', token:'SIGMA-LAMBDA-91', members:[{uid:'me',status:'approved'},{uid:'jordan',status:'approved'},{uid:'ava',status:'approved'},{uid:'sam',status:'pending'}] },
      { id:'g_run', name:'gator run club', owner:'priya', token:'GATOR-RUN', members:[{uid:'priya',status:'approved'},{uid:'ava',status:'approved'}] },
    ],
    items:[
      it('i1','me','Black satin slip dress','Dress','Black','Reformation','S','Going out','Black satin slip dress with thin straps and a midi length. Perfect for formals and date nights.','dry',true,['g_hume','g_sigma']),
      it('i2','me','Mid-wash denim jacket','Jacket','Denim','Levi\'s','M','Casual','Classic mid-wash denim jacket with a slightly oversized fit. Goes with everything.','owner',true,['g_hume']),
      it('i3','me','Cream cable-knit sweater','Sweater','Cream','Aritzia','S','Cozy','Soft cream cable-knit sweater. Warm without being bulky, great for cold lecture halls.','wash',true,[]),
      it('i4','me','White leather sneakers','Shoes','White','Nike','8','Sporty','Clean white leather sneakers with minimal wear.','owner',false,['g_sigma']),
      it('i5','maya','Red mini dress','Dress','Red','Zara','S','Going out','Bright red mini dress with a square neckline. A game-day and birthday favorite.','wash',true,['g_hume']),
      it('i6','maya','Navy tailored blazer','Jacket','Navy','Aritzia','S','Business','Structured navy blazer for interviews, presentations, and career fairs.','dry',true,['g_hume'],1,25),
      it('i7','maya','Olive cargo pants','Pants','Olive','Free People','M','Streetwear','Relaxed olive cargo pants with deep pockets.','owner',true,[]),
      it('i8','maya','Pink canvas tote','Bag','Pink','Baggu','OS','Casual','Roomy pink canvas tote that fits a laptop and a water bottle.','owner',true,[]),
      it('i9','jordan','Green satin midi skirt','Skirt','Green','Zara','S','Going out','Emerald satin midi skirt with a bias cut. Pairs well with a fitted top.','wash',true,['g_sigma']),
      it('i10','jordan','Oversized gray hoodie','Sweater','Gray','Nike','L','Cozy','Heavyweight gray hoodie, very oversized and very warm.','owner',true,[]),
      it('i11','jordan','Brown suede jacket','Jacket','Brown','Madewell','M','Vintage','Vintage-style brown suede jacket with a shearling collar.','dry',true,[]),
      it('i12','priya','Yellow floral sundress','Dress','Yellow','Free People','M','Boho','Flowy yellow sundress with a floral print. Made for sunny weekends.','wash',false,['g_hume']),
      it('i13','priya','Straight-leg blue jeans','Pants','Blue','Levi\'s','27','Casual','Straight-leg jeans in a classic blue wash.','owner',false,['g_hume']),
      it('i14','sam','Purple ruched top','Top','Purple','Urban Outfitters','M','Going out','Fitted purple top with ruched sides.','wash',false,['g_hume']),
      it('i15','ava','White formal gown','Dress','White','Lulus','S','Formal','Floor-length white gown with a sweetheart neckline. Ideal for formals and banquets.','dry',false,['g_sigma']),
      it('i16','ava','Black combat boots','Shoes','Black','Dr. Martens','7','Edgy','Black leather combat boots, already broken in.','owner',false,['g_sigma']),
    ],
    requests:[
      { id:'r1', item:'i1', borrower:'jordan', owner:'me', start:D(6), end:D(7), status:'pending', note:'', created:Date.now() - 7200e3 },
      { id:'r2', item:'i1', borrower:'maya', owner:'me', start:D(7), end:D(8), status:'pending', note:'', created:Date.now() - 3600e3 },
      { id:'r3', item:'i6', borrower:'me', owner:'maya', start:D(3), end:D(3), status:'pending', note:'', created:Date.now() - 1800e3 },
      { id:'r4', item:'i5', borrower:'priya', owner:'maya', start:D(10), end:D(11), status:'approved', note:'', created:Date.now() - 86400e3 },
      { id:'r5', item:'i2', borrower:'jordan', owner:'me', start:D(-4), end:D(-1), status:'approved', note:'', created:Date.now() - 6 * 86400e3 },
      { id:'r6', item:'i9', borrower:'me', owner:'jordan', start:D(-12), end:D(-10), status:'returned', note:'', created:Date.now() - 15 * 86400e3 },
    ],
    convs:[
      { id:'c1', members:['me','maya'], msgs:[
        { from:'me', text:'Hey! Could I borrow your navy blazer for my career fair?', t:Date.now() - 2000e3 },
        { from:'maya', text:'Of course! Just send a request for the day 🙂', t:Date.now() - 1900e3 },
        { from:'me', text:'Sent! I can pick it up the night before.', t:Date.now() - 1800e3 } ] },
      { id:'c2', members:['me','jordan'], msgs:[
        { from:'jordan', text:'Thanks again for the jacket! Okay if I bring it back Friday?', t:Date.now() - 90000e3 },
        { from:'me', text:'Sure, no rush. Just let me know when you\'re by Hume.', t:Date.now() - 88000e3 } ] },
    ],
  };
}

/* ================= access rules (what the backend would enforce) ================= */
const U = id => DB.users[id];
const V = () => DB.viewer;
const nameOf = id => id === V() ? 'You' : U(id).name;
const firstName = id => id === V() ? 'You' : U(id).name.split(' ')[0];
const areFriends = (a, b) => DB.friendships.some(f => f.status === 'accepted' && ((f.a === a && f.b === b) || (f.a === b && f.b === a)));
const friendship = (a, b) => DB.friendships.find(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
const friendsOf = u => Object.keys(DB.users).filter(x => x !== u && areFriends(u, x));
const groupsOf = u => DB.groups.filter(g => g.members.some(m => m.uid === u && m.status === 'approved'));
const isMember = (g, u) => g.members.some(m => m.uid === u && m.status === 'approved');
function canSee(u, item) {
  if (item.owner === u) return true;
  if (item.friends && areFriends(u, item.owner)) return true;
  return item.groups.some(gid => { const g = DB.groups.find(x => x.id === gid); return g && isMember(g, u) && isMember(g, item.owner); });
}
const getItem = id => DB.items.find(i => i.id === id);
const approvedFor = itemId => DB.requests.filter(r => r.item === itemId && r.status === 'approved');
function dayState(item, d, earliest) {
  if (earliest && d < earliest) return 'past';
  if (d < item.availFrom || d > item.availTo) return 'off';
  if (approvedFor(item.id).some(r => d >= r.start && d <= r.end)) return 'booked';
  return 'open';
}
function itemStatus(item) {
  const rs = DB.requests.filter(r => r.item === item.id);
  if (rs.some(r => r.status === 'approved' && r.end < TODAY)) return { k:'overdue', t:'Overdue' };
  if (rs.some(r => r.status === 'approved' && r.start <= TODAY && r.end >= TODAY)) return { k:'out', t:'Borrowed now' };
  const next = rs.filter(r => r.status === 'approved' && r.start > TODAY).sort((a, b) => a.start < b.start ? -1 : 1)[0];
  if (next) return { k:'reserved', t:'Booked ' + fmt(next.start) };
  if (rs.some(r => r.status === 'pending')) return { k:'requested', t:'Requested' };
  return { k:'available', t:'Available' };
}
function reqStatus(r) {
  if (r.status === 'approved' && r.end < TODAY) return { k:'overdue', t:'Overdue' };
  return { k:r.status, t:r.status[0].toUpperCase() + r.status.slice(1) };
}
function convFor(a, b) {
  let c = DB.convs.find(c => c.members.includes(a) && c.members.includes(b));
  if (!c) { c = { id:uid('c'), members:[a, b], msgs:[] }; DB.convs.push(c); }
  return c;
}
const sysMsg = (a, b, text) => convFor(a, b).msgs.push({ from:'sys', text, t:Date.now(), sys:true });

function apiCreateRequest(u, itemId, start, end) {
  const item = getItem(itemId);
  if (!item || !canSee(u, item)) return 'You do not have access to this item.';
  if (item.owner === u) return "You can't borrow your own item.";
  if (start > end) return 'The end date must be after the start date.';
  if (start < earliestStart()) return 'Requests must be sent at least 24 hours before the start date.';
  if (start < item.availFrom || end > item.availTo) return 'Those dates are outside when the owner lends this item.';
  if (approvedFor(itemId).some(r => overlaps(start, end, r.start, r.end))) return 'Some of those dates are already booked.';
  if (DB.requests.some(r => r.item === itemId && r.borrower === u && r.status === 'pending' && overlaps(start, end, r.start, r.end))) return 'You already have a pending request for these dates.';
  DB.requests.push({ id:uid('r'), item:itemId, borrower:u, owner:item.owner, start, end, status:'pending', note:'', created:Date.now() });
  return null;
}
function apiDecide(u, reqId, approve) {
  const r = DB.requests.find(x => x.id === reqId); if (!r || r.owner !== u || r.status !== 'pending') return 'This request can no longer be changed.';
  const item = getItem(r.item);
  if (!approve) { r.status = 'declined'; sysMsg(r.owner, r.borrower, `Request declined: ${item.title}, ${drange(r.start, r.end)}`); return null; }
  // Recheck inside the "transaction": approved reservations may never overlap.
  if (approvedFor(r.item).some(x => overlaps(r.start, r.end, x.start, x.end))) {
    r.status = 'declined'; r.note = 'Those dates were already booked when this request was reviewed.';
    return 'Those dates are no longer available, so this request was declined.';
  }
  r.status = 'approved';
  sysMsg(r.owner, r.borrower, `Request approved: ${item.title}, ${drange(r.start, r.end)}. Care: ${CARE[item.care]}.`);
  let auto = 0;
  DB.requests.filter(x => x.item === r.item && x.status === 'pending' && x.id !== r.id && overlaps(x.start, x.end, r.start, r.end)).forEach(x => {
    x.status = 'declined'; x.note = 'Someone else was approved for overlapping dates. Pick new dates and request again.'; auto++;
    sysMsg(x.owner, x.borrower, `${item.title}: your dates overlapped with an approved booking. Try different dates.`);
  });
  return auto ? `Approved. ${auto} overlapping request${auto > 1 ? 's were' : ' was'} declined automatically.` : null;
}

/* ================= navigation ================= */
const NAV = [
  { k:'closet',   t:'Closet',   i:'<path d="M12 7.5a2.2 2.2 0 1 1 2.2-2.2c0 1.2-2.2 1.6-2.2 3.3v.9"/><path d="M12 9.5 3.6 16c-.9.7-.4 1.9.7 1.9h15.4c1.1 0 1.6-1.2.7-1.9Z"/>' },
  { k:'explore',  t:'Explore',  i:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>' },
  { k:'groups',   t:'Groups',   i:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.6c2.3.2 4 1.6 4.6 4.4"/>' },
  { k:'requests', t:'Requests', i:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="m9.5 15 1.8 1.8 3.4-3.6"/>' },
  { k:'messages', t:'Messages', i:'<path d="M5 18.5V7a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 7v6.5a2.5 2.5 0 0 1-2.5 2.5H8.5Z"/>' },
];
function renderNav() {
  const pend = DB.requests.filter(r => r.owner === V() && r.status === 'pending').length;
  const fr = DB.friendships.filter(f => f.status === 'pending' && f.b === V()).length;
  const gp = DB.groups.filter(g => g.owner === V()).reduce((n, g) => n + g.members.filter(m => m.status === 'pending').length, 0);
  const counts = { requests:pend, closet:fr, groups:gp };
  $('#nav').innerHTML = NAV.map(n => `<button data-act="nav" data-tab="${n.k}" ${view.tab === n.k ? 'aria-current="page"' : ''}>
    <svg viewBox="0 0 24 24" aria-hidden="true">${n.i}</svg>${n.t}${counts[n.k] ? `<span class="badge" aria-label="${counts[n.k]} new">${counts[n.k]}</span>` : ''}</button>`).join('');
  $('#viewerSel').innerHTML = (window.CS_VIEWERS || ['me','maya','jordan'].map(id => [id, U(id).name])).map(([id, n]) => `<option value="${id}" ${(window.CS_VIEWER_SEL || V()) === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
}
function go(tab, extra = {}) { view = { ...view, tab, user:null, group:null, ...extra }; render(); window.scrollTo(0, 0); }

/* ================= shared snippets ================= */
const avatar = (id, cls = '') => `<span class="avatar ${cls}" style="background:${U(id).hue}" aria-hidden="true">${esc(U(id).name[0])}</span>`;
function itemCard(it, showOwner = true) {
  const st = itemStatus(it);
  return `<button class="item" data-act="open-item" data-id="${it.id}">
    <img class="photo" src="${photoOf(it)}" alt="${esc(it.title)}" loading="lazy">
    <span class="meta"><span class="name">${esc(it.title)}</span>
      <span class="sub">${showOwner ? esc(nameOf(it.owner)) + ' · ' : ''}${esc(it.brand)} · ${esc(it.size)}</span>
      <span class="pill ${st.k}">${st.t}</span></span></button>`;
}
const emptyBox = (title, text, btn = '') => `<div class="empty"><b>${title}</b>${text}${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`;

/* ================= Start screen ================= */
let authScreen = 'start';
function renderStart() {
  $('#nav').hidden = true; $('#viewerWrap').hidden = true;
  const feat = (img, t, d) => `<div class="feat"><img src="${img}" alt="" width="64" height="80"><div><h3>${t}</h3><p class="small muted">${d}</p></div></div>`;
  $('#main').innerHTML = `<div class="start">
    <div class="stage start-stage"><div class="valance"></div><div class="drape l"></div><div class="drape r"></div>
      <img class="cabinet" src="${cabinetSVG()}" alt="" width="150" height="204">
      <p class="start-kicker">Starting at the University of Florida</p>
      <h1 class="start-title">Your friends' closets, one shared space.</h1>
      <p class="start-lead">Why buy an outfit for one night when your roommate already has it? Borrow from friends, dorm floors, and your org, all in one place.</p>
      <div class="row" style="justify-content:center;margin-top:20px">
        <button class="btn primary" style="padding:13px 26px;font-size:16px" data-act="get-started">Get started</button>
        <button class="btn ghost" style="padding:13px 22px" data-act="get-started">I already have an account</button>
      </div>
    </div>
    <div class="feats">
      ${feat(garmentSVG('Dress','Pink'), 'Snap it, AI writes it', 'Upload a photo and AI fills in the description, type, color, and style. You just check it.')}
      ${feat(garmentSVG('Jacket','Denim'), 'Share with your circle', 'Closets stay private. Pick which items your friends and each group can see.')}
      ${feat(garmentSVG('Bag','Purple'), 'Borrow by the date', 'Pick days on a calendar. Once approved, those dates are locked so nobody double-books.')}
    </div>
    <p class="small muted" style="text-align:center;margin-top:18px">Demo prototype. Sign-in is simulated and everything stays in this browser.</p>
  </div>`;
}

/* ================= Sign in ================= */
function renderSignIn() {
  $('#nav').hidden = true; $('#viewerWrap').hidden = true;
  $('#main').innerHTML = `<div class="signin"><div class="card"><button class="btn link small" data-act="to-start" style="display:block;margin:-10px 0 8px -4px">‹ Back</button>
    <img class="cabinet" src="${cabinetSVG()}" alt="" width="150" height="204">
    <h1>Your friends' closets, one shared space.</h1>
    <p class="muted" style="margin:10px 0 22px">Borrow from roommates, dorm friends, and your org. Pick the dates, get approved, sort out pickup in DMs.</p>
    <button class="btn primary" style="width:100%;padding:13px" data-act="signin">Continue with Auth0</button>
    <p class="small muted" style="margin-top:14px">${window.CS_SIGNIN_NOTE || "Demo: sign-in is simulated and all data stays in this browser. You'll start as Alex, a University of Florida student."}</p>
  </div></div>`;
}

/* ================= Closet ================= */
function renderCloset() {
  const uidv = view.user || V(), mine = uidv === V(), u = U(uidv);
  const items = DB.items.filter(i => i.owner === uidv && canSee(V(), i));
  const fs = friendsOf(uidv), gs = groupsOf(uidv);
  let h = `<div class="card profile">${avatar(uidv, 'lg')}
    <div style="flex:1;min-width:200px"><h1>${esc(mine ? u.name : u.name)}</h1><div class="muted">@${esc(u.username)} · University of Florida</div>
      <div class="stats"><div><b>${u.stats ? u.stats.items : DB.items.filter(i => i.owner === uidv).length}</b>items</div><div><b>${u.stats ? u.stats.friends : fs.length}</b>friends</div><div><b>${u.stats ? u.stats.groups : gs.length}</b>groups</div></div></div>
    <div class="row">${mine
      ? `<button class="btn primary" data-act="add-item"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add item</button><button class="btn ghost" data-act="signout">Sign out</button>`
      : friendButton(uidv) + `<button class="btn ghost" data-act="open-chat" data-id="${uidv}">Message</button>`}</div></div>`;
  if (mine) {
    const inc = DB.friendships.filter(f => f.status === 'pending' && f.b === V());
    if (inc.length) h += `<div class="card" style="margin-top:14px"><div class="eyebrow">Friend requests</div>${inc.map(f => `<div class="person">${avatar(f.a)}<div class="who"><button class="linkish" data-act="open-user" data-id="${f.a}">${esc(U(f.a).name)}</button><span class="small muted">@${esc(U(f.a).username)}</span></div>
      <button class="btn sm primary" data-act="friend-accept" data-id="${f.a}">Accept</button><button class="btn sm ghost" data-act="friend-decline" data-id="${f.a}">Decline</button></div>`).join('')}</div>`;
  }
  h += `<div class="section-head"><div><div class="eyebrow">${mine ? 'Your closet' : esc(firstName(uidv)) + "'s closet"}</div><h2>${items.length} item${items.length === 1 ? '' : 's'}${mine ? '' : ' you can see'}</h2></div>
    ${mine ? '<span class="small muted">Closets are private. Only friends and groups you share with can see items.</span>' : ''}</div>`;
  if (items.length) h += armoireHTML(items);
  else h += mine ? emptyBox('Your closet is empty', 'Add your first item. AI fills in the details from the photo.', '<button class="btn primary" data-act="add-item">Add item</button>')
              : emptyBox('Nothing shared with you yet', areFriends(V(), uidv) ? `${esc(firstName(uidv))} hasn't shared items with friends.` : `${esc(firstName(uidv))}'s closet is private. Add them as a friend or join a group together.`);
  if (fs.length) h += `<div class="section-head"><h2>Friends</h2></div><div class="row">${fs.map(f => `<button class="chip" data-act="open-user" data-id="${f}">${avatar(f, 'sm')}${esc(nameOf(f))}</button>`).join('')}</div>`;
  if (mine) h += `<div style="margin-top:28px"><button class="btn link" data-act="reset">${resetArmed ? 'Tap again to reset the demo' : 'Reset demo data'}</button></div>`;
  $('#main').innerHTML = h;
}
function friendButton(id) {
  if (areFriends(V(), id)) return `<span class="pill available">Friends</span>`;
  const f = friendship(V(), id);
  if (f && f.a === V()) return `<span class="pill pending">Request sent</span>`;
  if (f && f.b === V()) return `<button class="btn sm primary" data-act="friend-accept" data-id="${id}">Accept request</button>`;
  return `<button class="btn sm primary" data-act="friend-add" data-id="${id}">Add friend</button>`;
}

/* ================= Explore ================= */
function renderExplore() {
  let h = `<div class="spread"><div><div class="eyebrow">Explore</div><h1>${view.explore === 'clothes' ? "Search your friends' closets" : 'Find people'}</h1></div>
    <div class="seg" role="group" aria-label="Search for"><button data-act="explore-mode" data-m="clothes" aria-pressed="${view.explore === 'clothes'}">Clothes</button><button data-act="explore-mode" data-m="people" aria-pressed="${view.explore === 'people'}">People</button></div></div>`;
  if (view.explore === 'clothes') {
    const opt = (arr, v) => '<option value="">Any</option>' + arr.map(x => `<option ${v === x ? 'selected' : ''}>${x}</option>`).join('');
    h += `<div class="card filters" style="margin-top:16px">
      <label class="f q">Search<input type="search" id="fq" value="${esc(F.q)}" placeholder="Try &quot;black dress&quot; or &quot;Zara&quot;"></label>
      <label class="f">Type<select id="ftype">${opt(TYPES, F.type)}</select></label>
      <label class="f">Size<select id="fsize">${opt(SIZES, F.size)}</select></label>
      <label class="f">Color<select id="fcolor">${opt(Object.keys(COLORS), F.color)}</select></label>
      <label class="f">Style<select id="fstyle">${opt(STYLES, F.style)}</select></label>
      <label class="f">Available on<input type="date" id="fdate" value="${F.date}" min="${TODAY}"></label>
    </div><div id="results"></div>`;
  } else {
    h += `<div class="card" style="margin-top:16px"><label class="f">Search by name or username<input type="search" id="pq" value="${esc(people)}" placeholder="e.g. Ava or @leokim"></label><div id="presults" style="margin-top:6px"></div></div>`;
  }
  $('#main').innerHTML = h;
  view.explore === 'clothes' ? renderResults() : renderPeople();
}
function renderResults() {
  const q = F.q.trim().toLowerCase();
  const list = DB.items.filter(i => i.owner !== V() && canSee(V(), i)).filter(i => {
    if (q && ![i.title, i.brand, i.type, i.color, i.style, i.desc, U(i.owner).name].join(' ').toLowerCase().includes(q)) return false;
    if (F.type && i.type !== F.type) return false;
    if (F.size && i.size !== F.size) return false;
    if (F.color && i.color !== F.color) return false;
    if (F.style && i.style !== F.style) return false;
    if (F.date && dayState(i, F.date) !== 'open') return false;
    return true;
  });
  const total = DB.items.filter(i => i.owner !== V() && canSee(V(), i)).length;
  $('#results').innerHTML = `<div class="section-head"><h2>${list.length} result${list.length === 1 ? '' : 's'}</h2><span class="small muted">Searching ${total} items shared with you by friends and groups</span></div>` +
    (list.length ? `<div class="items">${list.map(i => itemCard(i)).join('')}</div>` : emptyBox('No matches', 'Try fewer filters or a different date.'));
}
function renderPeople() {
  const q = people.trim().toLowerCase().replace(/^@/, '');
  const list = Object.values(DB.users).filter(u => u.id !== V() && (!q || u.name.toLowerCase().includes(q) || u.username.includes(q)));
  $('#presults').innerHTML = list.length ? list.map(u => {
    const shared = groupsOf(V()).filter(g => isMember(g, u.id)).map(g => g.name);
    return `<div class="person">${avatar(u.id)}<div class="who"><button class="linkish" data-act="open-user" data-id="${u.id}">${esc(u.name)}</button>
      <span class="small muted">@${esc(u.username)}${shared.length ? ' · in ' + esc(shared.join(', ')) : ''}</span></div>${friendButton(u.id)}</div>`;
  }).join('') : '<p class="muted">No one found with that name.</p>';
}

/* ================= Groups ================= */
function renderGroups() {
  if (view.group) return renderGroup(view.group);
  const mine = groupsOf(V());
  const pending = DB.groups.filter(g => g.members.some(m => m.uid === V() && m.status === 'pending'));
  let h = `<div class="spread"><div><div class="eyebrow">Groups</div><h1>Your trusted circles</h1></div></div>
    <div class="grid2" style="margin-top:16px">
      <div class="card"><h3>Create a group</h3><p class="small muted" style="margin:4px 0 10px">For your floor, your org, or your friend group. You'll get an invite link to share.</p>
        <div class="row"><input type="text" id="newGroup" placeholder="e.g. Broward Hall Girls" maxlength="40" style="flex:1"><button class="btn primary" data-act="create-group">Create</button></div></div>
      <div class="card"><h3>Join with an invite link</h3><p class="small muted" style="margin:4px 0 10px">Paste a link or code. The group owner approves new members.</p>
        <div class="row"><input type="text" id="joinCode" placeholder="closetshare.app/join/…" style="flex:1"><button class="btn primary" data-act="join-group">Join</button></div>
        <p class="small muted" style="margin-top:8px">Demo code to try: <b>GATOR-RUN</b></p></div>
    </div>
    <div class="section-head"><h2>Your groups</h2></div>`;
  h += mine.length ? `<div class="grid3">${mine.map(g => {
    const n = DB.items.filter(i => i.groups.includes(g.id)).length, mem = g.members.filter(m => m.status === 'approved');
    return `<button class="card groupcard" data-act="open-group" data-id="${g.id}"><div class="faces">${mem.slice(0, 5).map(m => avatar(m.uid, 'sm')).join('')}</div>
      <h3>${esc(g.name)}</h3><span class="small muted">${mem.length} members · ${n} shared items${g.owner === V() ? ' · You own this' : ''}</span>
      ${g.owner === V() && g.members.some(m => m.status === 'pending') ? '<span class="pill pending">Members waiting for approval</span>' : ''}</button>`;
  }).join('')}</div>` : emptyBox('No groups yet', 'Create one or join with an invite link.');
  if (pending.length) h += `<div class="section-head"><h2>Waiting for approval</h2></div><div class="row">${pending.map(g => `<span class="chip">${esc(g.name)} <span class="pill pending">Pending</span></span>`).join('')}</div>`;
  $('#main').innerHTML = h;
}
function renderGroup(gid) {
  const g = DB.groups.find(x => x.id === gid);
  if (!g || !isMember(g, V())) { view.group = null; return renderGroups(); }
  const owner = g.owner === V(), mem = g.members.filter(m => m.status === 'approved'), pend = g.members.filter(m => m.status === 'pending');
  const items = DB.items.filter(i => i.groups.includes(g.id) && isMember(g, i.owner));
  const myShared = DB.items.filter(i => i.owner === V() && i.groups.includes(g.id)).length;
  const myTotal = DB.items.filter(i => i.owner === V()).length;
  let h = `<button class="btn link" data-act="nav" data-tab="groups">‹ All groups</button>
    <div class="card" style="margin-top:8px"><div class="spread"><div><div class="eyebrow">Group${owner ? ' · you own this' : ''}</div><h1>${esc(g.name)}</h1>
      <div class="muted small" style="margin-top:4px">${mem.length} members · ${items.length} shared items</div></div>
      <div class="row"><button class="btn primary" data-act="share-modal" data-id="${g.id}">Choose items to share (${myShared}/${myTotal})</button>
      ${owner ? '' : `<button class="btn ghost" data-act="leave-group" data-id="${g.id}">Leave group</button>`}</div></div>
      <div class="grid2" style="margin-top:16px">
        <div><div class="eyebrow" style="margin-bottom:6px">Invite link</div><div class="invite"><span>closetshare.app/join/${esc(g.token)}</span><button class="btn sm" data-act="copy-invite" data-id="${g.id}">Copy</button></div>
          <p class="small muted" style="margin-top:6px">${owner ? 'New members wait for your approval.' : 'The owner approves new members.'}</p></div>
        <div><div class="eyebrow" style="margin-bottom:6px">Members</div><div class="row">${mem.map(m => `<button class="chip" data-act="open-user" data-id="${m.uid}">${avatar(m.uid, 'sm')}${esc(nameOf(m.uid))}${m.uid === g.owner ? ' · owner' : ''}</button>`).join('')}</div></div>
      </div>
      ${owner && pend.length ? `<div style="margin-top:14px"><div class="eyebrow">Waiting for approval</div>${pend.map(m => `<div class="person">${avatar(m.uid)}<div class="who"><b>${esc(U(m.uid).name)}</b><span class="small muted">@${esc(U(m.uid).username)}</span></div>
        <button class="btn sm primary" data-act="approve-member" data-g="${g.id}" data-id="${m.uid}">Approve</button><button class="btn sm ghost" data-act="deny-member" data-g="${g.id}" data-id="${m.uid}">Decline</button></div>`).join('')}</div>` : ''}
    </div>
    <div class="section-head"><h2>Shared in this group</h2><span class="small muted">${items.length} item${items.length === 1 ? '' : 's'}</span></div>`;
  h += `<div class="stage"><div class="valance"></div><div class="drape l"></div><div class="drape r"></div><p class="stage-title">${esc(g.name)}'s closet</p>${items.length ? `<div class="items">${items.map(i => itemCard(i)).join('')}</div>` : emptyBox('Nothing shared yet', 'Be the first to share something.')}</div>`;
  $('#main').innerHTML = h;
}
function openShareModal(gid, isNew) {
  const g = DB.groups.find(x => x.id === gid); const mine = DB.items.filter(i => i.owner === V());
  shareCtx = { gid, picked:new Set(mine.filter(i => i.groups.includes(gid)).map(i => i.id)) };
  modal(`<div class="modal-body"><div class="eyebrow">${isNew ? 'Welcome to ' + esc(g.name) : esc(g.name)}</div><h2 style="margin:4px 0 6px">Which items do you want to share with this group?</h2>
    <p class="small muted">Only members of this group will see the items you pick. You can change this anytime.</p>
    ${mine.length ? `<div class="spread" style="margin:12px 0 4px"><span class="small muted" id="shareCount"></span><button class="btn sm ghost" data-act="share-all">Share all</button></div>
    <div id="shareList">${mine.map(i => `<label class="check"><input type="checkbox" data-share="${i.id}" ${shareCtx.picked.has(i.id) ? 'checked' : ''}><img src="${photoOf(i)}" alt=""><span><b>${esc(i.title)}</b><br><span class="small muted">${esc(i.brand)} · ${esc(i.size)}</span></span></label>`).join('')}</div>`
    : '<p class="muted">You have no items yet. Add some to your closet first.</p>'}
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-act="close-modal">${isNew ? 'Skip for now' : 'Cancel'}</button><button class="btn primary" data-act="share-save">Save sharing</button></div></div>`, 'narrow');
  updateShareCount();
}
function updateShareCount() { const c = $('#shareCount'); if (c) c.textContent = `${shareCtx.picked.size} of ${DB.items.filter(i => i.owner === V()).length} selected`; }

/* ================= Requests ================= */
function renderRequests() {
  const rec = DB.requests.filter(r => r.owner === V()), sent = DB.requests.filter(r => r.borrower === V());
  const list = (view.reqTab === 'received' ? rec : sent).slice().sort((a, b) => {
    const order = { pending:0, approved:1, declined:2, canceled:3, returned:4 };
    return order[a.status] - order[b.status] || b.created - a.created;
  });
  const pr = rec.filter(r => r.status === 'pending').length, ps = sent.filter(r => r.status === 'pending').length;
  let h = `<div class="spread"><div><div class="eyebrow">Requests</div><h1>Borrowing requests</h1></div>
    <div class="seg" role="group" aria-label="Show"><button data-act="req-tab" data-m="received" aria-pressed="${view.reqTab === 'received'}">Received${pr ? ` (${pr})` : ''}</button><button data-act="req-tab" data-m="sent" aria-pressed="${view.reqTab === 'sent'}">Sent${ps ? ` (${ps})` : ''}</button></div></div>
    <div class="stack" style="margin-top:16px">`;
  if (!list.length) h += emptyBox(view.reqTab === 'received' ? 'No requests yet' : "You haven't sent any requests", view.reqTab === 'received' ? 'When friends ask to borrow your items, they show up here.' : 'Find something in Explore and pick your dates.');
  list.forEach(r => {
    const it = getItem(r.item); if (!it) return;
    const other = view.reqTab === 'received' ? r.borrower : r.owner, st = reqStatus(r);
    const clash = r.status === 'pending' && view.reqTab === 'received' ? DB.requests.filter(x => x.id !== r.id && x.item === r.item && x.status === 'pending' && overlaps(x.start, x.end, r.start, r.end)) : [];
    let acts = '';
    if (view.reqTab === 'received' && r.status === 'pending') acts = `<button class="btn sm primary" data-act="decide" data-id="${r.id}" data-v="1">Approve</button><button class="btn sm ghost" data-act="decide" data-id="${r.id}" data-v="0">Decline</button>`;
    if (r.status === 'approved') acts = (view.reqTab === 'received' ? `<button class="btn sm good" data-act="returned" data-id="${r.id}">Mark returned</button>` : '') + `<button class="btn sm ghost" data-act="cancel-req" data-id="${r.id}">Cancel</button>`;
    if (view.reqTab === 'sent' && r.status === 'pending') acts = `<button class="btn sm ghost" data-act="cancel-req" data-id="${r.id}">Withdraw</button>`;
    acts += `<button class="btn sm ghost" data-act="open-chat" data-id="${other}">Message</button>`;
    h += `<div class="card req"><img src="${photoOf(it)}" alt="">
      <div style="min-width:0"><div class="row" style="gap:8px"><button class="linkish" data-act="open-item" data-id="${it.id}">${esc(it.title)}</button><span class="pill ${st.k}">${st.t}</span></div>
        <div class="small muted" style="margin-top:3px">${view.reqTab === 'received' ? 'From' : 'Owner:'} <button class="linkish" data-act="open-user" data-id="${other}">${esc(nameOf(other))}</button> · ${drange(r.start, r.end)} · ${daysBetween(r.start, r.end)} day${daysBetween(r.start, r.end) > 1 ? 's' : ''}</div>
        <div class="small muted">Care: ${CARE[it.care]}${r.status === 'approved' ? ' · Return by ' + fmt(r.end) : ''}</div>
        ${clash.length ? `<div class="note warn">Overlaps with ${clash.map(x => esc(firstName(x.borrower)) + "'s request (" + drange(x.start, x.end) + ')').join(', ')}. Approving this one declines the other.</div>` : ''}
        ${st.k === 'overdue' ? `<div class="note bad">This was due back ${fmt(r.end)}.</div>` : ''}
        ${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}</div>
      <div class="acts">${acts}</div></div>`;
  });
  $('#main').innerHTML = h + '</div>';
}

/* ================= Messages ================= */
function renderMessages() {
  const convs = DB.convs.filter(c => c.members.includes(V())).sort((a, b) => (b.msgs.at(-1)?.t || 0) - (a.msgs.at(-1)?.t || 0));
  if (view.conv && !convs.find(c => c.id === view.conv)) view.conv = null;
  const cur = convs.find(c => c.id === view.conv);
  const other = c => c.members.find(m => m !== V());
  let h = `<div class="spread" style="margin-bottom:14px"><div><div class="eyebrow">Messages</div><h1>Direct messages</h1></div><span class="small muted">Plan pickups, returns, and washing here.</span></div>
    <div class="msgs ${cur ? 'in-thread' : ''}"><div class="convlist">`;
  h += convs.length ? convs.map(c => { const o = other(c), last = c.msgs.at(-1);
    return `<button class="conv" data-act="conv" data-id="${c.id}" ${cur && cur.id === c.id ? 'aria-current="true"' : ''}>${avatar(o)}<span class="who"><b>${esc(U(o).name)}</b><span>${last ? esc((last.from === V() ? 'You: ' : '') + last.text) : 'Say hi'}</span></span></button>`; }).join('')
    : '<p class="muted" style="padding:16px">No conversations yet. Message a friend from their profile or an item.</p>';
  h += `</div><div class="thread">`;
  if (cur) {
    const o = other(cur);
    h += `<div class="thread-head"><button class="btn sm ghost back" data-act="conv-back">‹</button>${avatar(o)}<div><button class="linkish" data-act="open-user" data-id="${o}">${esc(U(o).name)}</button><div class="small muted">@${esc(U(o).username)}</div></div></div>
      <div class="thread-body" id="tbody">${cur.msgs.map(m => m.sys ? `<div class="sysmsg">${esc(m.text)}</div>` : `<div class="bubble ${m.from === V() ? 'mine' : ''}">${esc(m.text)}</div>`).join('') || '<p class="muted small" style="text-align:center">Start the conversation.</p>'}</div>
      <form class="composer" id="composer"><input type="text" id="msgInput" placeholder="Message ${esc(firstName(o))}…" autocomplete="off" aria-label="Message"><button class="btn primary" type="submit">Send</button></form>`;
  } else h += `<div style="display:grid;place-items:center;height:100%" class="muted">Pick a conversation</div>`;
  $('#main').innerHTML = h + '</div></div>';
  const tb = $('#tbody'); if (tb) tb.scrollTop = tb.scrollHeight;
}

/* ================= Item detail modal ================= */
function calHTML(item, interactive) {
  const first = new Date(cal.y, cal.m, 1), days = new Date(cal.y, cal.m + 1, 0).getDate(), earliest = interactive ? earliestStart() : null;
  const pendDays = !interactive ? DB.requests.filter(r => r.item === item.id && r.status === 'pending') : [];
  let cells = ['S','M','T','W','T','F','S'].map(d => `<span class="dow">${d}</span>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const ds = iso(new Date(cal.y, cal.m, d)), st = dayState(item, ds, earliest);
    let cls = st;
    if (sel.start && (ds === sel.start || ds === sel.end)) cls += ' sel';
    else if (sel.start && sel.end && ds > sel.start && ds < sel.end) cls += ' inrange';
    if (ds === TODAY) cls += ' today';
    if (pendDays.some(r => ds >= r.start && ds <= r.end) && st !== 'booked') cls += ' pend';
    const can = interactive && st === 'open';
    const label = { past:'too soon to request', off:'not lendable', booked:'booked', open:'available' }[st];
    cells += `<button class="d ${cls}" ${can ? `data-act="cal-day" data-d="${ds}"` : 'disabled'} aria-label="${fmtLong(ds)}, ${label}">${d}</button>`;
  }
  return `<div class="cal"><div class="cal-head"><button class="cal-nav" data-act="cal-prev" aria-label="Previous month">‹</button><b>${first.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</b><button class="cal-nav" data-act="cal-next" aria-label="Next month">›</button></div>
    <div class="cal-grid">${cells}</div>
    <div class="legend"><span><i style="background:var(--good-soft)"></i>Available</span><span><i style="background:repeating-linear-gradient(-45deg,var(--bad-soft) 0 3px,transparent 3px 6px);border:1px solid var(--bad-soft)"></i>Booked</span><span><i style="background:var(--surface-2)"></i>Not lendable or too soon</span>${interactive ? '<span><i style="background:var(--accent)"></i>Your dates</span>' : '<span><i style="background:var(--warn);border-radius:50%;width:8px;height:8px"></i>Pending request</span>'}</div></div>`;
}
function selSummary(item) {
  if (!sel.start) return `<p class="small muted">Tap a start date, then an end date. Requests must be sent at least 24 hours ahead.</p>`;
  const end = sel.end || sel.start, others = DB.requests.filter(r => r.item === item.id && r.status === 'pending' && r.borrower !== V() && overlaps(sel.start, end, r.start, r.end)).length;
  return `<p style="margin:0"><b>${drange(sel.start, end)}</b> · ${daysBetween(sel.start, end)} day${daysBetween(sel.start, end) > 1 ? 's' : ''}</p>
    ${others ? `<p class="small muted" style="margin:2px 0 0">${others} other pending request${others > 1 ? 's overlap' : ' overlaps'} these dates. The owner picks who gets it.</p>` : ''}`;
}
function openItem(id) {
  const it = getItem(id); if (!it || !canSee(V(), it)) { toast("You don't have access to that item."); return; }
  const mine = it.owner === V(), st = itemStatus(it);
  const startMonth = parseISO(mine ? TODAY : (earliestStart() > it.availFrom ? earliestStart() : it.availFrom));
  cal = { y:startMonth.getFullYear(), m:startMonth.getMonth() }; sel = { start:null, end:null };
  const bookings = DB.requests.filter(r => r.item === id && ['pending','approved'].includes(r.status));
  modal(`<div class="modal-body"><div class="detail">
    <div><img class="photo" src="${photoOf(it)}" alt="${esc(it.title)}"></div>
    <div>
      <div class="row" style="gap:8px"><span class="pill ${st.k}">${st.t}</span><span class="small muted">${esc(it.style)}</span></div>
      <h2 style="margin:8px 0 4px;font-size:24px">${esc(it.title)}</h2>
      <div class="row small" style="gap:6px">${avatar(it.owner, 'sm')}<button class="linkish" data-act="open-user" data-id="${it.owner}">${esc(nameOf(it.owner))}</button></div>
      <p style="margin:12px 0 0">${esc(it.desc)}</p>
      <div class="kv"><div>Type<b>${esc(it.type)}</b></div><div>Brand<b>${esc(it.brand)}</b></div><div>Size<b>${esc(it.size)}</b></div><div>Color<b>${esc(it.color)}</b></div>
        <div>Care<b>${CARE[it.care]}</b></div><div>Lends<b>${drange(it.availFrom, it.availTo)}</b></div></div>
      ${mine ? `<div class="row" style="margin-bottom:14px"><button class="btn primary" data-act="edit-item" data-id="${it.id}">Edit listing</button></div>
          <div class="eyebrow" style="margin-bottom:6px">Bookings</div>
          ${bookings.length ? bookings.map(r => `<div class="small" style="padding:4px 0"><span class="pill ${reqStatus(r).k}">${reqStatus(r).t}</span> ${esc(nameOf(r.borrower))} · ${drange(r.start, r.end)}</div>`).join('') : '<p class="small muted">No upcoming bookings.</p>'}
          <div style="margin-top:12px" id="calWrap">${calHTML(it, false)}</div>`
        : `<div class="eyebrow" style="margin-bottom:6px">Pick your dates</div><div id="calWrap">${calHTML(it, true)}</div>
          <div style="margin:12px 0" id="selSum">${selSummary(it)}</div>
          <div class="row"><button class="btn primary" data-act="send-request" data-id="${it.id}" id="reqBtn" ${sel.start ? '' : 'disabled'}>Request to borrow</button><button class="btn ghost" data-act="open-chat" data-id="${it.owner}">Message ${esc(firstName(it.owner))}</button></div>
          <p class="small muted" style="margin-top:10px">By requesting, you agree to the care rule above. Pickup and return are arranged in DMs.</p>`}
    </div></div></div>`);
  modal.item = id;
}
function refreshCal() {
  const it = getItem(modal.item); if (!it) return;
  const mine = it.owner === V();
  $('#calWrap').innerHTML = calHTML(it, !mine);
  if (!mine) { $('#selSum').innerHTML = selSummary(it); $('#reqBtn').disabled = !sel.start; }
}

/* ================= Item editor ================= */
function openEditor(id) {
  const it = id ? getItem(id) : null;
  if (it && it.owner !== V()) { toast('Only the owner can edit this listing.'); return; }
  ed = it ? { ...it, groups:[...it.groups] } : { id:null, title:'', type:'', color:'', brand:'', size:'', style:'', desc:'', care:'wash', friends:true, groups:[], photo:null, availFrom:TODAY, availTo:addDays(TODAY, 60), ai:false };
  deleteArmed = false;
  const opt = (arr, v, ph) => `<option value="">${ph}</option>` + arr.map(x => `<option ${v === x ? 'selected' : ''}>${x}</option>`).join('');
  const groups = groupsOf(V());
  modal(`<div class="modal-body"><div class="eyebrow">${it ? 'Edit listing' : 'New item'}</div><h2 style="margin:4px 0 16px">${it ? esc(it.title) : 'Add to your closet'}</h2>
    <div class="detail">
      <div>
        <label class="upload ${ed.photo || it ? 'has' : ''}" id="uploadBox">${uploadInner()}<input class="vh" type="file" accept="image/png,image/jpeg,image/webp" id="photoIn"></label>
        <div class="row" style="justify-content:center;margin-top:8px"><button class="btn link small" data-act="sample-photo">No photo handy? Use a sample</button></div>
        <div class="ai-box" id="aiBox" style="margin-top:10px">${ed.ai ? aiDoneText() : `<b>${aiName()}</b> suggests a title, description, type, color, and style after you upload a product photo.`}</div>
      </div>
      <div class="stack">
        <label class="f">Title <input type="text" id="e_title" value="${esc(ed.title)}" maxlength="60" placeholder="e.g. Black satin slip dress"></label>
        <label class="f"><span>Description ${ed.ai ? '<span class="ai-chip">AI suggested · editable</span>' : ''}</span><textarea id="e_desc" maxlength="300" placeholder="What is it, how does it fit, when would you wear it?">${esc(ed.desc)}</textarea></label>
        <div class="grid2">
          <label class="f">Item type<select id="e_type">${opt(TYPES, ed.type, 'Choose type')}</select></label>
          <label class="f">Brand<input type="text" id="e_brand" value="${esc(ed.brand)}" maxlength="40" placeholder="Brand"></label>
          <label class="f">Size<select id="e_size">${opt(SIZES, ed.size, 'Choose size')}</select></label>
          <label class="f">Color<select id="e_color">${opt(Object.keys(COLORS), ed.color, 'Choose color')}</select></label>
          <label class="f">Style<select id="e_style">${opt(STYLES, ed.style, 'Choose style')}</select></label>
          <label class="f">Care<select id="e_care">${Object.entries(CARE).map(([k, v]) => `<option value="${k}" ${ed.care === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        </div>
        <div><div class="eyebrow" style="margin-bottom:6px">Days you'll lend it</div>
          <div class="grid2"><label class="f">From<input type="date" id="e_from" value="${ed.availFrom}"></label><label class="f">Until<input type="date" id="e_to" value="${ed.availTo}"></label></div></div>
        <div><div class="eyebrow" style="margin-bottom:2px">Who can see it</div>
          <label class="check"><input type="checkbox" id="e_friends" ${ed.friends ? 'checked' : ''}><span><b>All my friends</b></span></label>
          ${groups.map(g => `<label class="check"><input type="checkbox" data-eg="${g.id}" ${ed.groups.includes(g.id) ? 'checked' : ''}><span><b>${esc(g.name)}</b></span></label>`).join('')}
          <p class="small muted" style="margin-top:6px">Unchecked means private. Only you will see it.</p></div>
        <div class="spread" style="margin-top:4px">
          ${it ? `<button class="btn danger" data-act="delete-item" id="delBtn">Delete</button>` : '<span></span>'}
          <div class="row"><button class="btn ghost" data-act="close-modal">Cancel</button><button class="btn primary" data-act="save-item">${it ? 'Save changes' : 'Add to closet'}</button></div>
        </div>
      </div>
    </div></div>`);
}
function uploadInner() {
  const src = ed.photo || (ed.id ? photoOf(ed) : null);
  return src ? `<img src="${src}" alt="Product photo">` : `<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5"/></svg><b>Upload a product photo</b><span class="small muted">JPG, PNG or WebP, up to 8 MB</span>`;
}
const aiDoneText = () => `<b>${aiName()} filled in the details.</b> Check the description, type, color, and style. Add the brand and size yourself, since those can't be read from a photo.`;
function readPhoto(file) {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return rej(new Error('type'));
    if (file.size > 8 * 1024 * 1024) return rej(new Error('size'));
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => {
      const M = 700, s = Math.min(1, M / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', .82));
    }; im.onerror = rej; im.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function dominantColor(src) {
  return new Promise(res => {
    const im = new Image(); im.onload = () => {
      const N = 48, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.drawImage(im, 0, 0, N, N);
      let d; try { d = g.getImageData(0, 0, N, N).data; } catch (e) { return res(null); }
      let r = 0, gg = 0, b = 0, n = 0;
      for (let y = 8; y < N - 8; y++) for (let x = 8; x < N - 8; x++) {
        const i = (y * N + x) * 4, R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        if (mx > 232 && mx - mn < 18) continue; // skip white backdrop
        if (Math.abs(R - 241) < 6 && Math.abs(G - 242) < 6 && Math.abs(B - 245) < 6) continue;
        r += R; gg += G; b += B; n++;
      }
      if (!n) return res('White');
      r /= n; gg /= n; b /= n;
      let best = null, bd = 1e9;
      for (const [name, hex] of Object.entries(COLORS)) {
        const v = parseInt(hex.slice(1), 16), dr = r - (v >> 16), dg = gg - (v >> 8 & 255), db = b - (v & 255), dist = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (dist < bd) { bd = dist; best = name; }
      }
      res(best);
    }; im.onerror = () => res(null); im.src = src;
  });
}
const STYLE_GUESS = { Dress:'Going out', Top:'Casual', Sweater:'Cozy', Jacket:'Casual', Pants:'Casual', Skirt:'Going out', Shoes:'Sporty', Bag:'Casual' };
const DESC = {
  Dress: (c, s) => `${c} ${s.toLowerCase()} dress with a flattering silhouette. Great for formals, date nights, or game-day events.`,
  Top: (c, s) => `${c} top with an easy ${s.toLowerCase()} look. Pairs well with jeans or a skirt.`,
  Sweater: (c) => `Soft ${c.toLowerCase()} knit that keeps you warm without feeling bulky. Good for cold lecture halls.`,
  Jacket: (c, s) => `${c} jacket with a ${s.toLowerCase()} feel. Easy to layer over almost anything.`,
  Pants: (c) => `${c} pants with a comfortable fit for class or a night out.`,
  Skirt: (c) => `${c} skirt that dresses up a simple top. Works for parties and dinners.`,
  Shoes: (c) => `${c} shoes in good condition, comfortable enough for a full day on campus.`,
  Bag: (c) => `${c} bag with room for the essentials.`,
};
function toJpegBlob(src, maxSide = 0) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const svg = src.startsWith('data:image/svg');
      let w = svg ? 400 : im.naturalWidth, h = svg ? 500 : im.naturalHeight;
      if (maxSide && Math.max(w, h) > maxSide) { const k = maxSide / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(b => b ? res(b) : rej(new Error('Could not prepare the photo')), 'image/jpeg', .9);
    };
    im.onerror = () => rej(new Error('Could not read the photo'));
    im.src = src;
  });
}
async function geminiDescribe(src) {
  const fd = new FormData(); fd.append('file', await toJpegBlob(src, 512), 'photo.jpg'); // small photo = faster upload and AI
  // Dev login header. When Auth0 is on, send "Authorization: Bearer <token>" instead.
  const headers = window.CS_AUTH_HEADERS ? await window.CS_AUTH_HEADERS() : { 'X-Dev-User': DB.viewer };
  const res = await fetch(API_URL + '/api/ai/describe', { method:'POST', body:fd, headers });
  if (!res.ok) { let msg = 'error ' + res.status; try { msg = (await res.json()).detail || msg; } catch (e) {} throw new Error(msg); }
  return res.json();
}
async function runAI() {
  const box = $('#aiBox'); if (!box) return;
  box.innerHTML = `<span class="spinner"></span> ${aiName()} is describing your item… You can fill in the brand and size meanwhile.`;
  let s = null, problem = '';
  if (API_URL) { try { s = await geminiDescribe(ed.photo); } catch (err) { problem = err.message; } }
  if (!$('#aiBox')) return;
  const typeEl = $('#e_type');
  if (s) {
    if (s.title && !$('#e_title').value) $('#e_title').value = s.title;
    if (s.description) $('#e_desc').value = s.description;
    if (s.item_type) typeEl.value = s.item_type;
    if (s.color) $('#e_color').value = s.color;
    if (s.style) $('#e_style').value = s.style;
    box.innerHTML = aiDoneText() + (s.confidence_note ? ` <b>Note:</b> ${esc(s.confidence_note)}` : '') + `<br><span class="small muted">Generated by ${aiName()}.</span>`;
  } else {
    // Offline fallback: template text plus the color detected from the photo.
    const [color] = await Promise.all([dominantColor(ed.photo), API_URL ? 0 : sleep(1300)]);
    if (!$('#aiBox')) return;
    const type = typeEl.value || 'Top', c = color || 'Black', style = $('#e_style').value || STYLE_GUESS[type], typeGuessed = !typeEl.value;
    if (!$('#e_title').value) $('#e_title').value = `${c} ${type === 'Shoes' ? 'shoes' : type.toLowerCase()}`;
    $('#e_desc').value = DESC[type](c, style);
    $('#e_color').value = c; typeEl.value = type; $('#e_style').value = style;
    box.innerHTML = aiDoneText() + (typeGuessed ? ' <b>The item type is a low-confidence guess.</b>' : '') +
      (problem ? `<br><span class="small muted">${esc(problem)} For now this is a rough guess.</span><br><button class="btn sm primary" style="margin-top:8px" data-act="ai-retry">Try ${aiName()} again</button>` : '<br><span class="small muted">Demo suggestion. Set CLOSETSHARE_API in config.js to use real AI.</span>');
  }
  ed.ai = true;
  const lbl = $('#e_desc').closest('label').querySelector('span'); if (lbl && !lbl.querySelector('.ai-chip')) lbl.insertAdjacentHTML('beforeend', ' <span class="ai-chip">AI suggested · editable</span>');
}
function saveItem() {
  const v = id => $(id).value.trim();
  const data = { title:v('#e_title'), desc:v('#e_desc'), type:v('#e_type'), brand:v('#e_brand'), size:v('#e_size'), color:v('#e_color'), style:v('#e_style'), care:v('#e_care'),
    availFrom:v('#e_from'), availTo:v('#e_to'), friends:$('#e_friends').checked, groups:[...document.querySelectorAll('[data-eg]')].filter(x => x.checked).map(x => x.dataset.eg) };
  const missing = ['title','type','size','color','style'].filter(k => !data[k]);
  if (missing.length) { toast('Add the ' + missing.join(', ') + ' before saving.'); return; }
  if (!data.brand) data.brand = 'No brand';
  if (!data.availFrom || !data.availTo || data.availFrom > data.availTo) { toast('Pick lending dates where "From" comes before "Until".'); return; }
  if (!ed.photo && !ed.id) { toast('Upload a product photo or use a sample.'); return; }
  if (ed.id) {
    const it = getItem(ed.id); if (it.owner !== V()) return;
    Object.assign(it, data); if (ed.photo) it.photo = ed.photo;
    toast('Listing updated');
  } else {
    DB.items.unshift({ id:uid('i'), owner:V(), photo:ed.photo, ...data });
    toast('Added to your closet');
  }
  save(); closeModal(); go('closet');
}

/* ================= modal shell ================= */
function modal(html, cls = '') {
  $('#modalRoot').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="modal-x" data-act="close-modal" aria-label="Close">×</button>${html}</div></div>`;
  document.body.style.overflow = 'hidden';
  const f = $('#modalRoot .modal-x'); if (f) f.focus({ preventScroll:true });
}
function closeModal() { $('#modalRoot').innerHTML = ''; document.body.style.overflow = ''; modal.item = null; ed = null; shareCtx = null; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal(); });

/* ================= render ================= */
function render() {
  if (!DB.signedIn) return authScreen === 'start' ? renderStart() : renderSignIn();
  $('#nav').hidden = false; $('#viewerWrap').hidden = !!window.CS_HIDE_VIEWER;
  renderNav();
  ({ closet:renderCloset, explore:renderExplore, groups:renderGroups, requests:renderRequests, messages:renderMessages })[view.tab]();
}

/* ================= events ================= */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'overlay' && e.target !== b) return;
  if (b.disabled) return;
  switch (act) {
    case 'signin': DB.signedIn = true; save(); render(); toast(`hey ${U(V()).name.split(' ')[0].toLowerCase()} :)`); break;
    case 'signout': DB.signedIn = false; authScreen = 'start'; save(); render(); window.scrollTo(0, 0); break;
    case 'get-started': authScreen = 'signin'; render(); window.scrollTo(0, 0); break;
    case 'to-start': authScreen = 'start'; render(); window.scrollTo(0, 0); break;
    case 'nav': go(b.dataset.tab); break;
    case 'overlay': case 'close-modal': closeModal(); break;
    case 'open-user': closeModal(); go('closet', { user:id === V() ? null : id }); break;
    case 'open-item': openItem(id); break;
    case 'add-item': openEditor(null); break;
    case 'edit-item': openEditor(id); break;
    case 'save-item': saveItem(); break;
    case 'delete-item':
      if (!deleteArmed) { deleteArmed = true; b.textContent = 'Tap again to delete'; break; }
      DB.items = DB.items.filter(i => i.id !== ed.id); DB.requests.forEach(r => { if (r.item === ed.id && r.status === 'pending') r.status = 'canceled'; });
      save(); closeModal(); toast('Listing deleted'); go('closet'); break;
    case 'sample-photo': {
      const type = $('#e_type').value || 'Top', color = Object.keys(COLORS)[Math.floor(Math.random() * 16)];
      ed.photo = garmentSVG(type, color); ed.newPhoto = true; $('#uploadBox').classList.add('has'); $('#uploadBox').querySelector('img, svg, b, span')?.remove();
      $('#uploadBox').innerHTML = uploadInner() + '<input class="vh" type="file" accept="image/png,image/jpeg,image/webp" id="photoIn">';
      runAI(); break;
    }
    case 'ai-retry': if (ed && ed.photo) runAI(); break;
    case 'cal-prev': cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } refreshCal(); break;
    case 'cal-next': cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } refreshCal(); break;
    case 'cal-day': {
      const d = b.dataset.d, it = getItem(modal.item);
      if (!sel.start || sel.end || d < sel.start) sel = { start:d, end:null };
      else if (d === sel.start) sel = { start:d, end:null };
      else {
        let ok = true; for (let x = sel.start; x <= d; x = addDays(x, 1)) if (dayState(it, x, earliestStart()) !== 'open') { ok = false; break; }
        if (ok) sel.end = d; else { toast('That range includes unavailable days. Pick a shorter range.'); sel = { start:d, end:null }; }
      }
      refreshCal(); break;
    }
    case 'send-request': {
      const err = apiCreateRequest(V(), id, sel.start, sel.end || sel.start);
      if (err) { toast(err); break; }
      const it = getItem(id); save(); closeModal(); toast(`Request sent to ${U(it.owner).name.split(' ')[0]}`); view.reqTab = 'sent'; go('requests'); break;
    }
    case 'decide': { const msg = apiDecide(V(), id, b.dataset.v === '1'); save(); render(); toast(msg || (b.dataset.v === '1' ? 'Approved. Those dates are now blocked.' : 'Request declined')); break; }
    case 'cancel-req': { const r = DB.requests.find(x => x.id === id); if (!r || (r.borrower !== V() && r.owner !== V())) break;
      r.status = 'canceled'; sysMsg(r.owner, r.borrower, `Booking canceled: ${getItem(r.item).title}, ${drange(r.start, r.end)}. Dates released.`); save(); render(); toast('Canceled. The dates are free again.'); break; }
    case 'returned': { const r = DB.requests.find(x => x.id === id); if (!r || r.owner !== V()) break; r.status = 'returned'; sysMsg(r.owner, r.borrower, `${getItem(r.item).title} marked as returned. Thanks!`); save(); render(); toast('Marked as returned'); break; }
    case 'req-tab': view.reqTab = b.dataset.m; render(); break;
    case 'explore-mode': view.explore = b.dataset.m; render(); break;
    case 'open-chat': { if (id === V()) break; const c = convFor(V(), id); save(); closeModal(); go('messages', { conv:c.id }); setTimeout(() => $('#msgInput')?.focus(), 50); break; }
    case 'conv': view.conv = id; renderMessages(); break;
    case 'conv-back': view.conv = null; renderMessages(); break;
    case 'friend-add': {
      DB.friendships.push({ a:V(), b:id, status:'pending' }); save(); render(); toast('Friend request sent');
      const me = V(); setTimeout(() => { const f = friendship(me, id); if (f && f.status === 'pending') { f.status = 'accepted'; save(); if (DB.viewer === me) { render(); toast(`${U(id).name} accepted your friend request (demo)`); } } }, 4000);
      break;
    }
    case 'friend-accept': { const f = friendship(V(), id); if (f) f.status = 'accepted'; save(); render(); toast(`You and ${U(id).name.split(' ')[0]} are now friends`); break; }
    case 'friend-decline': DB.friendships = DB.friendships.filter(f => !(f.a === id && f.b === V())); save(); render(); break;
    case 'create-group': {
      const name = $('#newGroup').value.trim(); if (!name) { toast('Give your group a name'); $('#newGroup').focus(); break; }
      const g = { id:uid('g'), name, owner:V(), token:'CS-' + Math.random().toString(36).slice(2, 8).toUpperCase(), members:[{ uid:V(), status:'approved' }] };
      DB.groups.push(g); save(); view.group = g.id; render(); openShareModal(g.id, true); break;
    }
    case 'join-group': {
      const raw = $('#joinCode').value.trim().split('/').pop().toUpperCase(); const g = DB.groups.find(x => x.token.toUpperCase() === raw);
      if (!g) { toast("That invite link isn't valid. Check it and try again."); break; }
      const m = g.members.find(x => x.uid === V());
      if (m) { toast(m.status === 'approved' ? "You're already in this group" : 'Your request is still waiting for approval'); break; }
      g.members.push({ uid:V(), status:'pending' }); save(); render(); toast(`Request sent. ${U(g.owner).name.split(' ')[0]} will approve it.`);
      const me = V(); setTimeout(() => { const mm = g.members.find(x => x.uid === me); if (mm && mm.status === 'pending') { mm.status = 'approved'; save();
        if (DB.viewer === me) { view.group = g.id; go('groups', { group:g.id }); toast(`${U(g.owner).name.split(' ')[0]} approved you (demo)`); openShareModal(g.id, true); } } }, 3000);
      break;
    }
    case 'open-group': view.group = id; render(); window.scrollTo(0, 0); break;
    case 'copy-invite': { const g = DB.groups.find(x => x.id === id), text = 'https://closetshare.app/join/' + g.token;
      try { await navigator.clipboard.writeText(text); toast('Invite link copied'); } catch (err) { toast('Copy failed. Select the link and copy it manually.'); } break; }
    case 'approve-member': case 'deny-member': {
      const g = DB.groups.find(x => x.id === b.dataset.g); if (!g || g.owner !== V()) break;
      if (act === 'approve-member') { g.members.find(m => m.uid === id).status = 'approved'; toast(`${U(id).name} joined ${g.name}`); }
      else { g.members = g.members.filter(m => m.uid !== id); toast('Request declined'); }
      save(); render(); break;
    }
    case 'leave-group': { const g = DB.groups.find(x => x.id === id); if (!g || g.owner === V()) break;
      g.members = g.members.filter(m => m.uid !== V()); DB.items.forEach(i => { if (i.owner === V()) i.groups = i.groups.filter(x => x !== id); });
      save(); view.group = null; render(); toast(`You left ${g.name}`); break; }
    case 'share-modal': openShareModal(id, false); break;
    case 'share-all': { const all = DB.items.filter(i => i.owner === V()); const every = shareCtx.picked.size === all.length;
      shareCtx.picked = new Set(every ? [] : all.map(i => i.id)); document.querySelectorAll('[data-share]').forEach(x => x.checked = !every);
      b.textContent = every ? 'Share all' : 'Unshare all'; updateShareCount(); break; }
    case 'share-save': {
      const g = DB.groups.find(x => x.id === shareCtx.gid);
      DB.items.forEach(i => { if (i.owner !== V()) return; const has = i.groups.includes(g.id), want = shareCtx.picked.has(i.id);
        if (want && !has) i.groups.push(g.id); if (!want && has) i.groups = i.groups.filter(x => x !== g.id); });
      const n = shareCtx.picked.size; save(); closeModal(); render(); toast(`Sharing ${n} item${n === 1 ? '' : 's'} with ${g.name}`); break;
    }
    case 'reset':
      if (!resetArmed) { resetArmed = true; render(); break; }
      resetArmed = false; DB = seed(); DB.signedIn = true; save(); view = { tab:'closet', user:null, group:null, conv:null, reqTab:'received', explore:'clothes' }; render(); toast('Demo data reset'); break;
  }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'viewerSel') { DB.viewer = e.target.value; save(); closeModal(); view = { ...view, user:null, group:null, conv:null }; render(); toast(`Now viewing as ${U(DB.viewer).name}`); return; }
  if (e.target.id === 'photoIn' && e.target.files[0]) {
    try { ed.photo = await readPhoto(e.target.files[0]); ed.newPhoto = true; }
    catch (err) { toast(err.message === 'size' ? 'That photo is over 8 MB. Try a smaller one.' : 'Use a JPG, PNG, or WebP photo.'); return; }
    $('#uploadBox').classList.add('has'); $('#uploadBox').innerHTML = uploadInner() + '<input class="vh" type="file" accept="image/png,image/jpeg,image/webp" id="photoIn">';
    runAI(); return;
  }
  if (e.target.dataset.share) { e.target.checked ? shareCtx.picked.add(e.target.dataset.share) : shareCtx.picked.delete(e.target.dataset.share); updateShareCount(); return; }
  const map = { ftype:'type', fsize:'size', fcolor:'color', fstyle:'style', fdate:'date' };
  if (map[e.target.id]) { F[map[e.target.id]] = e.target.value; renderResults(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'fq') { F.q = e.target.value; renderResults(); }
  if (e.target.id === 'pq') { people = e.target.value; renderPeople(); }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'composer') return;
  e.preventDefault();
  const inp = $('#msgInput'), text = inp.value.trim(); if (!text) return;
  const c = DB.convs.find(x => x.id === view.conv); if (!c) return;
  c.msgs.push({ from:V(), text, t:Date.now() }); save(); renderMessages(); $('#msgInput').focus();
  const other = c.members.find(m => m !== V()), me = V();
  const replies = ['Sounds good! I\'m around after 5.', 'Perfect, I\'ll leave it by my door 🙂', 'Yes! Want to meet at the dining hall?', 'Of course, just bring it back clean please!', 'Works for me. See you then!'];
  setTimeout(() => { c.msgs.push({ from:other, text:replies[Math.floor(Math.random() * replies.length)], t:Date.now() }); save(); if (DB.viewer === me && view.tab === 'messages' && view.conv === c.id) renderMessages(); }, 1800);
});

/* ================= boot ================= */
DB = load();
if (!DB || !DB.users || !DB.items) { DB = seed(); save(); }
render();
