/* WearShare UI — screens rebuilt from the Figma design ("swamphacks-app · weardrobe").
   Loaded after app.js: it replaces the screen-drawing functions but keeps all app logic,
   data rules, and the backend connection (live.js) exactly as they were. */

/* ---------- icons (Lucide, same set used in the Figma file) ---------- */
const IC = {
  shirt:'<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  compass:'<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  message:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  inbox:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  right:'<path d="m9 18 6-6-6-6"/>', left:'<path d="m15 18-6-6 6-6"/>',
  arrowLeft:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', arrowUp:'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>', search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  apple:'<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>', checkCircle:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  calendar:'<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  sliders:'<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const GOOGLE = '<svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

/* ---------- small helpers ---------- */
  const av = (id, cls = '') => { const u = U(id); return `<span class="av ${cls}" aria-hidden="true">${u && u.photo ? `<img src="${esc(u.photo)}" alt="">` : esc((u?.name || '?')[0])}</span>`; };
  const statsOf = id => {
  const u = U(id) || {};
  return u.stats || { items:DB.items.filter(i => i.owner === id).length, friends:friendsOf(id).length, groups:groupsOf(id).length };
};
function availLine(it) {
  const ap = approvedFor(it.id);
  const cur = ap.find(r => r.start <= TODAY && r.end >= TODAY) || ap.filter(r => r.start > TODAY).sort((a, b) => a.start < b.start ? -1 : 1)[0];
  if (cur) return `<span class="txt-red">Reserved ${drange(cur.start, cur.end)}</span>`;
  if (it.availFrom <= TODAY && it.availTo >= TODAY) return `<span class="txt-green">Available now</span>`;
  return `<span class="txt-green">Available ${drange(it.availFrom, it.availTo)}</span>`;
}
function borrowTag(it) {
  const k = itemStatus(it).k;
  if (k === 'out' || k === 'overdue') return '<span class="tag borrowed">Currently borrowed</span>';
  if (k === 'reserved') return `<span class="tag borrowed">${itemStatus(it).t}</span>`;
  return '<span class="tag avail">Available to borrow</span>';
}
function pieceRow(it, tag = '') {
  return `<button class="piece" data-act="open-item" data-id="${it.id}">
    <span class="polaroid"><img src="${photoOf(it)}" alt="${esc(it.title)}" loading="lazy"></span>
    <span class="info"><b>${esc(it.title)}</b><small>${esc(it.size)} · ${esc(it.brand)}</small>${tag}</span>
    ${icon('right', 'chev')}</button>`;
}
function gridCard(it, mode) {
  const busy = approvedFor(it.id).some(r => r.end >= TODAY);
  if (mode === 'search') {
    return `<button class="gcard" data-act="open-item" data-id="${it.id}"><span class="gphoto"><img src="${photoOf(it)}" alt="${esc(it.title)}" loading="lazy">
      <span class="gsize left">${esc(it.size)}</span>${it.brand ? `<span class="gavail gbrand">${esc(it.brand)}</span>` : ''}</span>
      <span class="gbody"><b>${esc(it.title)}</b><small>${esc(U(it.owner).name)} · ${esc(it.brand)}</small></span></button>`;
  }
  return `<button class="gcard" data-act="open-item" data-id="${it.id}"><span class="gphoto"><img src="${photoOf(it)}" alt="${esc(it.title)}" loading="lazy"><span class="gsize">${esc(it.size)}</span></span>
    <span class="gbody"><b>${esc(it.title)}</b><span class="owner">${av(it.owner, 'sm')}${youName(it.owner)}</span>${availLine(it)}</span></button>`;
}
const emptyCard = (title, text, btn = '', ic = 'shirt') => `<div class="empty">${icon(ic)}<b>${title}</b><span class="muted sm b">${text}</span>${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`;
function wordmark(scale = 1) {
  const L = (ch, o) => `<span class="wm" style="width:${o.w * scale}px;height:${o.h * scale}px;font-size:${o.f * scale}px;background:${o.bg || 'transparent'};color:${o.c};border-radius:${(o.r || 0) * scale}px;transform:rotate(${o.rot}deg);${o.b ? `border:${3 * scale}px solid ${o.b};` : ''}">${ch}</span>`;
  return `<div class="wordmark" role="img" aria-label="WearShare">
    <div class="wm-row">${L('W', { w:52, h:58, f:38, bg:'#2c2047', c:'#b8e0d2', r:6, rot:-3 })}${L('e', { w:38, h:42, f:28, bg:'#f4a7b9', c:'#2c2047', r:20, rot:2 })}${L('a', { w:26, h:50, f:42, c:'#2c2047', rot:-2 })}${L('r', { w:34, h:46, f:30, bg:'#fff', c:'#2c2047', r:4, rot:3, b:'#2c2047' })}</div>
    <div class="wm-row">${L('S', { w:50, h:56, f:38, bg:'#f4a7b9', c:'#2c2047', r:12, rot:-2 })}${L('h', { w:40, h:60, f:38, bg:'#2c2047', c:'#fff', r:8, rot:2 })}${L('a', { w:22, h:46, f:40, c:'#5a4a6b', rot:-1 })}${L('r', { w:36, h:44, f:28, bg:'#fff', c:'#2c2047', r:18, rot:3, b:'#f4a7b9' })}${L('e', { w:46, h:52, f:34, bg:'#5a4a6b', c:'#f4a7b9', r:8, rot:-2 })}</div></div>`;
}

/* ---------- shell ---------- */
const scrollScreen = y => { const sc = $('#screen'); if (sc) sc.scrollTop = y === 'bottom' ? sc.scrollHeight : y; };
let lastScreenKey = '';
function go(tab, extra = {}) { view = { ...view, tab, user:null, group:null, sub:null, conv:null, ...extra }; render(); }
function render() {
  document.body.classList.toggle('signed-out', !DB.signedIn);
  document.body.dataset.tab = DB.signedIn ? view.tab : '';
  const key = DB.signedIn ? [view.tab, view.sub, view.user, view.group, view.conv].join('|') : 'welcome';
  if (!DB.signedIn) { $('#nav').hidden = true; $('#viewerWrap').hidden = true; renderStart(); }
  else {
    $('#nav').hidden = false;
    renderNav();
    ({ closet:renderCloset, explore:renderExplore, groups:renderGroups, requests:renderRequests, messages:renderMessages })[view.tab]();
  }
  if (key !== lastScreenKey) {  // a new screen: animate it in and start at the top
    lastScreenKey = key;
    const m = $('#main'); m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter');
    scrollScreen(view.conv && view.tab === 'messages' ? 'bottom' : 0);
  }
}
function renderNav() {
  const pend = DB.requests.filter(r => r.owner === V() && r.status === 'pending').length;
  const fr = DB.friendships.filter(f => f.status === 'pending' && f.b === V()).length;
  const gp = DB.groups.filter(g => g.owner === V()).reduce((n, g) => n + g.members.filter(m => m.status === 'pending').length, 0);
  const items = [['closet', 'Closet', 'shirt', fr], ['explore', 'Search', 'compass', 0], ['groups', 'Groups', 'users', gp], ['messages', 'Messages', 'message', 0], ['requests', 'Requests', 'inbox', pend]];
  $('#nav').innerHTML = items.map(([k, t, ic, n]) => `<button data-act="nav" data-tab="${k}" ${view.tab === k ? 'aria-current="page"' : ''}>
    <span class="ibox">${icon(view.tab === k && k === 'explore' ? 'search' : ic)}</span>${t}${n ? `<span class="badge">${n}</span>` : ''}</button>`).join('');
  const viewers = window.CS_VIEWERS || ['me', 'maya', 'jordan'].map(id => [id, U(id) ? U(id).name : id]);
  $('#viewerSel').innerHTML = viewers.map(([id, n]) => `<option value="${id}" ${(window.CS_VIEWER_SEL || V()) === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
  $('#viewerWrap').hidden = !!window.CS_HIDE_VIEWER;
}

/* ---------- welcome / sign in ---------- */
const APPLE = '<svg width="16" height="19" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
function renderStart() {
  $('#main').innerHTML = `<section class="welcome">
    ${wordmark(1.15)}
    <div class="stack">
      <button class="btn plum block" data-act="signin">Continue with Auth0</button>
    </div></section>`;
}
function renderSignIn() { renderStart(); }

/* ---------- closet ---------- */
function renderCloset() {
  if (view.sub === 'friends') return renderFriends();
  if (view.sub === 'addfriends') return renderAddFriends();
  const uidv = view.user || V(), mine = uidv === V(), u = U(uidv);
  if (!u) { view.user = null; return renderCloset(); }
  const items = DB.items.filter(i => i.owner === uidv && canSee(V(), i));
  const st = statsOf(uidv);
  let h = '';
  if (mine) {
    const inc = DB.friendships.filter(f => f.status === 'pending' && f.b === V()).length;
    h += `<div class="closet-head"><section class="profile">${av(uidv, 'lg')}<div class="grow"><h1 class="name">${esc(u.name)}</h1>
      <div class="counts"><div><b>${st.items}</b><span>pieces</span></div><i class="dotsep"></i><div><b>${st.friends}</b><span>friends</span></div><i class="dotsep"></i><div><b>${st.groups}</b><span>groups</span></div></div></div></section>
      <div class="row" style="margin-top:12px;flex-wrap:nowrap"><button class="btn primary grow" data-act="add-item">Add a piece ${icon('plus')}</button>
      <button class="btn" data-act="friends-page">${icon('users')}Friends${inc ? ` <span class="tag pending">${inc}</span>` : ''}</button></div></div>
      <hr class="rule">`;
    h += items.length ? `<div class="closet-grid">${items.map(i => pieceRow(i, i.groups.length || i.friends ? '' : '<span class="tag borrowed">Private</span>')).join('')}</div>`
      : emptyCard('Your closet is empty', 'Add your first piece. AI fills in the details from the photo.', '<button class="btn primary" data-act="add-item">Add a piece</button>');
    h += `<div class="row closet-foot" style="justify-content:space-between;margin-top:22px"><button class="btn sm" data-act="signout">${icon('logout')}Sign out</button></div>`;
  } else {
    const friends = areFriends(V(), uidv);
    h += `${backBtn('closet-back', 'Friends')}
      <section class="profile" style="margin-top:10px">${av(uidv, 'lg')}<div class="grow"><h1 class="name">${esc(u.name)}</h1>
      <div style="margin-top:4px">${friends ? `<span class="txt-red">${icon('check', 'chev')} Friends with you</span>` : friendButton(uidv)}</div></div></section>
      <button class="btn primary block lg" style="margin-top:14px" data-act="open-chat" data-id="${uidv}">${icon('message')}Message ${esc(u.name.split(' ')[0])}</button>
      <hr class="rule">
      <div class="spread"><h2 style="font-size:24px">${esc(u.name.split(' ')[0])}’s closet</h2><span class="b sm muted">${items.length} pieces</span></div>`;
    h += items.length ? `<div class="closet-grid">${items.map(i => pieceRow(i, borrowTag(i))).join('')}</div>`
      : emptyCard('Nothing shared with you yet', friends ? `${esc(u.name.split(' ')[0])} hasn't shared pieces with friends.` : 'This closet is private. Add them as a friend or join a group together.');
  }
  $('#main').innerHTML = h;
}
function friendButton(id) {
  if (areFriends(V(), id)) return '<span class="tag avail">Friends</span>';
  const f = friendship(V(), id);
  if (f && f.a === V()) return '<span class="tag pending">Requested</span>';
  if (f && f.b === V()) return `<button class="btn sm primary" data-act="friend-accept" data-id="${id}">Accept</button>`;
  return `<button class="btn sm primary" data-act="friend-add" data-id="${id}">Add friend</button>`;
}
let friendQ = '';
function renderFriends() {
  const me = U(V()), all = friendsOf(V());
  const inc = DB.friendships.filter(f => f.status === 'pending' && f.b === V());
  $('#main').innerHTML = `${backBtn('closet-back', 'My closet')}
    <div class="spread" style="margin-top:8px"><div><h1 class="h1">Friends<span class="countbubble">${all.length}</span></h1>
      <div class="b sm muted" style="margin-top:4px">${esc(me.name.split(' ')[0])}’s circle of closets</div></div>${av(V(), '')}</div>
    <button class="btn primary block" style="margin-top:14px" data-act="addfriends-page">Add friends ${icon('plus')}</button>
    <label class="searchbar" style="margin-top:12px">${icon('search')}<input type="search" id="friendQ" value="${esc(friendQ)}" placeholder="Search your friends" aria-label="Search your friends"></label>
    ${inc.length ? `<div class="caps">Friend requests</div><div class="card" style="padding:4px 14px">${inc.map(f => `<div class="person">${av(f.a)}<div class="who"><b>${esc(U(f.a).name)}</b><small>@${esc(U(f.a).username)}</small></div>
      <button class="btn sm primary" data-act="friend-accept" data-id="${f.a}">Accept</button><button class="btn sm" data-act="friend-decline" data-id="${f.a}">Decline</button></div>`).join('')}</div>` : ''}
    <div class="spread" style="margin:16px 0 4px"><span class="b">All friends</span><span class="b sm">${all.length} friends</span></div>
    <div id="friendList"></div>`;
  renderFriendList();
}
function renderFriendList() {
  const q = friendQ.trim().toLowerCase();
  const list = friendsOf(V()).filter(id => !q || U(id).name.toLowerCase().includes(q) || U(id).username.includes(q));
  $('#friendList').innerHTML = list.length ? list.map(id => `<div class="person">${av(id)}<div class="who"><b>${esc(U(id).name)}</b>
    <small>${statsOf(id).items} pieces · <button class="linkish" data-act="open-user" data-id="${id}">View closet</button></small></div>
    <button class="back" data-act="open-user" data-id="${id}" aria-label="Open ${esc(U(id).name)}'s closet">${icon('right', 'chev')}</button></div>`).join('')
    : `<p class="muted b sm">${q ? 'No friends match that name.' : 'No friends yet. Tap Add friends to find people.'}</p>`;
}
function renderAddFriends() {
  $('#main').innerHTML = `${backBtn('closet-back', 'Friends')}
    <div class="spread" style="margin-top:8px"><div><h1 class="h1">Add friends</h1><div class="b sm muted" style="margin-top:4px">Grow your circle of closets</div></div>${av(V())}</div>
    <label class="searchbar" style="margin-top:14px">${icon('search')}<input type="search" id="pq" value="${esc(people)}" placeholder="Search by username" aria-label="Search by username"></label>
    <hr class="rule"><h2 style="font-size:20px">People you may know</h2><div id="presults"></div>
    <p class="b sm" style="margin-top:12px">You’ll be friends once they accept your request.</p>`;
  renderPeople();
}
function renderPeople() {
  const q = people.trim().toLowerCase().replace(/^@/, '');
  const list = Object.values(DB.users).filter(u => u.id !== V() && !areFriends(V(), u.id) && (!q || u.name.toLowerCase().includes(q) || u.username.includes(q)));
  $('#presults').innerHTML = list.length ? list.map(u => `<div class="person">${av(u.id)}<div class="who"><b>${esc(u.name)}</b><small>@${esc(u.username)}</small></div>${friendButton(u.id)}</div>`).join('')
    : `<p class="muted b sm">${q ? 'No one found with that username.' : 'You’re friends with everyone here.'}</p>`;
}

/* ---------- search ---------- */
function renderExplore() {
  const sel = (id, label, arr, v) => `<select class="chip ${v ? 'on' : ''}" id="${id}" aria-label="${label}"><option value="">${label}</option>${arr.map(x => `<option ${v === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  const brands = [...new Set(DB.items.filter(i => i.owner !== V() && canSee(V(), i)).map(i => i.brand))].sort();
  const gs = groupsOf(V());
  $('#main').innerHTML = `<h1 class="h-script rasp" style="margin:6px 0 12px">Search</h1>
    <label class="searchbar">${icon('search')}<input type="search" id="fq" value="${esc(F.q)}" placeholder="Try &quot;floral dress&quot; or a brand…" aria-label="Search"></label>
    <div class="chips scroll" style="margin-top:14px"><button class="chip ${!F.group ? 'on' : ''}" data-act="sgroup" data-id="">All groups</button>
      ${gs.map(g => `<button class="chip ${F.group === g.id ? 'on' : ''}" data-act="sgroup" data-id="${g.id}">${esc(g.name)}</button>`).join('')}</div>
    <div class="chips scroll" style="margin-top:10px">${sel('ftype', 'Type', TYPES, F.type)}${sel('fsize', 'Size', SIZES, F.size)}${sel('fbrand', 'Brand', brands, F.brand)}${sel('fcolor', 'Color', Object.keys(COLORS), F.color)}${sel('fstyle', 'Style', STYLES, F.style)}
      <label class="chip ${F.date ? 'on' : ''}">Available <input type="date" id="fdate" value="${F.date}" min="${TODAY}" style="border:none;background:none;font-weight:900;width:118px"></label></div>
    <div id="results"></div>`;
  renderResults();
}
function renderResults() {
  const q = F.q.trim().toLowerCase();
  const list = DB.items.filter(i => i.owner !== V() && canSee(V(), i)).filter(i => {
    if (q && ![i.title, i.brand, i.type, i.color, i.style, i.desc, U(i.owner).name].join(' ').toLowerCase().includes(q)) return false;
    if (F.group && !i.groups.includes(F.group)) return false;
    if (F.type && i.type !== F.type) return false;
    if (F.size && i.size !== F.size) return false;
    if (F.brand && i.brand !== F.brand) return false;
    if (F.color && i.color !== F.color) return false;
    if (F.style && i.style !== F.style) return false;
    if (F.date && dayState(i, F.date) !== 'open') return false;
    return true;
  });
  $('#results').innerHTML = `<div class="spread" style="margin:16px 0 10px"><span class="b">${list.length} item${list.length === 1 ? '' : 's'}</span><span class="b sm">${icon('lock', 'chev')} Private</span></div>` +
    (list.length ? `<div class="grid photo-grid">${list.map(i => gridCard(i, 'search')).join('')}</div>` : emptyCard('No matches', 'Try fewer filters or a different date.'));
}

/* ---------- groups ---------- */
function renderGroups() {
  if (view.group) { view.sub = null; return renderGroup(view.group); }
  if (view.sub === 'create') return renderCreateGroup();
  if (view.sub === 'join') return renderJoinGroup();
  const mine = groupsOf(V());
  const pending = DB.groups.filter(g => g.members.some(m => m.uid === V() && m.status === 'pending'));
  $('#main').innerHTML = `<div class="groups-bg"><h1 class="h-script" style="margin:8px 0 16px">Groups</h1>
    <div class="grid"><button class="bigpick" data-act="group-create-page">Create group</button><button class="bigpick" data-act="group-join-page">Join group</button></div>
    <div class="caps">My groups</div>
    <div class="stack">${mine.length ? mine.map(g => {
      const mem = g.members.filter(m => m.status === 'approved').length, waiting = g.members.filter(m => m.status === 'pending').length;
      return `<div class="groupcard"><div class="spread"><button class="gname" data-act="open-group" data-id="${g.id}">${icon(g.owner === V() ? 'checkCircle' : 'home')}${esc(g.name)}</button>${g.owner === V() ? '<span class="tag owner">owner</span>' : ''}</div>
        <div class="spread b sm muted" style="margin-top:6px"><span>${mem} members · Private</span><span>${icon('lock', 'chev')} ${g.owner === V() && waiting ? `${waiting} waiting` : 'approval required'}</span></div>
        <button class="btn link sm" style="padding-left:0;margin-top:6px;text-decoration:none" data-act="copy-invite" data-id="${g.id}">${icon('link')}Copy invitation link</button></div>`;
    }).join('') : emptyCard('No groups yet', 'Create one for your floor or friend group, or join with an invite link.')}
    ${pending.map(g => `<div class="groupcard"><div class="spread"><span class="gname">${icon('home')}${esc(g.name)}</span><span class="tag pending">pending</span></div><div class="b sm muted" style="margin-top:6px">Waiting for the owner to approve you.</div></div>`).join('')}</div></div>`;
}
function renderCreateGroup() {
  $('#main').innerHTML = `<div class="groups-bg">${backBtn('groups-back', '', 'aria-label="Back to groups"')}<h1 class="h-script" style="display:inline;margin-left:4px">Create group</h1>
    <p class="b" style="margin:10px 0 12px">A little circle for your shared wardrobe.</p>
    <div class="card stack"><label class="field"><span>Group name</span><input class="input" id="newGroup" maxlength="60" placeholder="Sunday swap"></label><span class="hint">Pick a name your friends will recognize.</span></div>
    <div class="card" style="margin-top:14px"><div class="row">${icon('lock')}<span class="script" style="font-size:26px">Just your people</span></div>
      <p class="hint" style="margin:6px 0 12px">Private group · Friends join with an invitation link.</p>
      <div class="spread"><div><div class="b">Approve new members</div><div class="hint">You decide who gets to join.</div></div><label class="toggle"><input type="checkbox" id="newGroupApproval" checked aria-label="Approve new members"><span></span></label></div></div>
    <button class="btn wine block lg" style="margin-top:22px" data-act="create-group">Create group ${icon('heart')}</button></div>`;
}
function renderJoinGroup() {
  $('#main').innerHTML = `<div class="groups-bg">${backBtn('groups-back', '', 'aria-label="Back to groups"')}<h1 class="h-script" style="display:inline;margin-left:4px">Join group</h1>
    <div class="card" style="margin-top:14px"><div class="b" style="margin-bottom:10px">Invitation link</div>
      <label class="searchbar" style="border-radius:14px">${icon('link')}<input id="joinCode" placeholder="wearshare.app/join/…" aria-label="Invitation link"></label>
      <div id="joinPreview"></div>${window.CS_LIVE ? '' : '<p class="hint" style="margin-top:8px">Demo code to try: <b>GATOR-RUN</b></p>'}</div>
    <div id="joinGroupCard"></div>
    <button class="btn wine block lg" style="margin-top:22px" data-act="join-group">Join ${icon('arrowRight')}</button>
    <p class="b sm muted" style="text-align:center;margin-top:10px">We’ll let you know when you’re approved.</p></div>`;
}
function updateJoinPreview() {
  const raw = ($('#joinCode')?.value || '').trim().split('/').pop().toUpperCase();
  const g = raw && DB.groups.find(x => x.token && x.token.toUpperCase() === raw);
  $('#joinPreview').innerHTML = g ? `<p class="txt-red" style="margin-top:8px">${icon('checkCircle', 'chev')} Invitation found</p>` : '';
  $('#joinGroupCard').innerHTML = g ? `<div class="card" style="margin-top:14px"><div class="row" style="flex-wrap:nowrap"><span class="gtile" style="width:56px;height:56px">${icon('users')}</span>
    <div><div class="script" style="font-size:28px">${esc(g.name)}</div><div class="b sm muted">${g.members.filter(m => m.status === 'approved').length} members · Private</div></div></div>
    <p class="b sm muted" style="margin-top:10px">${icon('lock', 'chev')} Approval required</p><p class="b sm">The group owner will review your request before you can see shared pieces.</p></div>` : '';
}
let groupQ = '';
function renderGroup(gid) {
  const g = DB.groups.find(x => x.id === gid);
  if (!g || !isMember(g, V())) { view.group = null; return renderGroups(); }
  const owner = g.owner === V(), mem = g.members.filter(m => m.status === 'approved'), pend = g.members.filter(m => m.status === 'pending');
  const myShared = DB.items.filter(i => i.owner === V() && i.groups.includes(g.id)).length, myTotal = DB.items.filter(i => i.owner === V()).length;
  $('#main').innerHTML = `<div class="groups-bg">
    <div class="spread">${backBtn('groups-back', 'Groups')}${owner ? '' : `<button class="btn sm" data-act="leave-group" data-id="${g.id}">Leave</button>`}</div>
    <div class="row" style="margin-top:10px;flex-wrap:nowrap"><span class="gtile">${icon('heart')}</span><div class="grow"><h1 class="h-script" style="font-size:40px">${esc(g.name)}</h1>
      <div class="b sm muted">${icon('lock', 'chev')} ${mem.length} members · Private</div></div></div>
    <div class="row" style="margin-top:12px"><button class="btn sm" data-act="copy-invite" data-id="${g.id}"><span style="color:var(--rasp)">${icon('link')}</span>Copy Invite Link</button>
      <button class="btn sm" data-act="share-modal" data-id="${g.id}">Share my pieces (${myShared}/${myTotal})</button></div>
    ${owner && pend.length ? `<div class="card" style="margin-top:12px;padding:4px 14px"><div class="caps" style="margin:10px 0 0">Waiting for approval</div>${pend.map(m => `<div class="person">${av(m.uid)}<div class="who"><b>${esc(U(m.uid).name)}</b><small>@${esc(U(m.uid).username)}</small></div>
      <button class="btn sm primary" data-act="approve-member" data-g="${g.id}" data-id="${m.uid}">Approve</button><button class="btn sm" data-act="deny-member" data-g="${g.id}" data-id="${m.uid}">Decline</button></div>`).join('')}</div>` : ''}
    <h2 class="script" style="font-size:32px;color:var(--wine);margin-top:16px;border-bottom:2.5px solid var(--ink);padding-bottom:4px">Shared wardrobe <span class="sup" id="gcount"></span></h2>
    <div class="row" style="margin-top:12px;flex-wrap:nowrap"><label class="searchbar grow" style="border-radius:14px;padding:10px 14px">${icon('compass')}<input type="search" id="gq" value="${esc(groupQ)}" placeholder="Search everyone’s pieces" aria-label="Search this group"></label></div>
    <div id="gresults"></div>
    <p class="b xs muted" style="margin-top:14px">${icon('lock', 'chev')} Only approved ${esc(g.name)} members can see these pieces.</p></div>`;
  renderGroupItems(g);
}
function renderGroupItems(g) {
  const q = groupQ.trim().toLowerCase();
  const all = DB.items.filter(i => i.groups.includes(g.id) && isMember(g, i.owner));
  const list = all.filter(i => !q || [i.title, i.brand, i.type, i.color, i.style, U(i.owner).name].join(' ').toLowerCase().includes(q));
  $('#gcount').textContent = all.length;
  $('#gresults').innerHTML = `<div class="b" style="margin:12px 0 10px">${list.length} piece${list.length === 1 ? '' : 's'} from your group</div>` +
    (list.length ? `<div class="grid photo-grid">${list.map(i => gridCard(i, 'search')).join('')}</div>` : emptyCard('Nothing here yet', all.length ? 'No pieces match that search.' : 'Be the first to share a piece with this group.', all.length ? '' : `<button class="btn primary sm" data-act="share-modal" data-id="${g.id}">Share my pieces</button>`));
}
function openShareModal(gid, isNew) {
  const g = DB.groups.find(x => x.id === gid); if (!g) return;
  const mine = DB.items.filter(i => i.owner === V());
  shareCtx = { gid, picked:new Set(mine.filter(i => i.groups.includes(gid)).map(i => i.id)) };
  modal(`${backBtn('close-modal', isNew ? 'Skip for now' : g.name)}
    <h1 class="h-script" style="margin:10px 0 4px">${isNew ? 'Welcome to ' + esc(g.name) : 'Share with ' + esc(g.name)}</h1>
    <p class="b sm muted">Pick which pieces this group can see. Only its members will see them, and you can change this anytime.</p>
    ${mine.length ? `<div class="spread" style="margin:14px 0 6px"><span class="b sm" id="shareCount"></span><button class="btn sm" data-act="share-all">Share all</button></div>
    <div class="card" style="padding:4px 14px">${mine.map(i => `<label class="check"><input type="checkbox" data-share="${i.id}" ${shareCtx.picked.has(i.id) ? 'checked' : ''}><img src="${photoOf(i)}" alt=""><span>${esc(i.title)}<br><span class="xs muted">${esc(i.size)} · ${esc(i.brand)}</span></span></label>`).join('')}</div>`
    : emptyCard('No pieces yet', 'Add pieces to your closet first.')}
    <div class="cta"><button class="btn primary block lg" data-act="share-save">Save sharing</button></div>`);
  updateShareCount();
}

/* ---------- requests ---------- */
function renderRequests() {
  const rec = DB.requests.filter(r => r.owner === V()), sent = DB.requests.filter(r => r.borrower === V());
  const order = { pending:0, approved:1, declined:2, canceled:3, returned:4 };
  const list = (view.reqTab === 'received' ? rec : sent).slice().sort((a, b) => order[a.status] - order[b.status] || b.created - a.created);
  let h = `<div class="topband"><h1 class="h1">Requests</h1></div>
    <div class="tabs" role="group" aria-label="Show"><button data-act="req-tab" data-m="received" aria-pressed="${view.reqTab === 'received'}">Received</button><button data-act="req-tab" data-m="sent" aria-pressed="${view.reqTab === 'sent'}">Sent</button></div><div class="stack">`;
  if (!list.length) h += emptyCard(view.reqTab === 'received' ? 'No requests yet' : 'No requests sent', view.reqTab === 'received' ? 'When friends ask to borrow your pieces, they show up here.' : 'Find something in Search and pick your dates.');
  list.forEach(r => {
    const it = getItem(r.item); if (!it) return;
    const recv = view.reqTab === 'received', other = recv ? r.borrower : r.owner, st = reqStatus(r);
    const clash = r.status === 'pending' && recv ? DB.requests.filter(x => x.id !== r.id && x.item === r.item && x.status === 'pending' && overlaps(x.start, x.end, r.start, r.end)) : [];
    let acts = '';
    if (recv && r.status === 'pending') acts = `<button class="btn pink" data-act="decide" data-id="${r.id}" data-v="1">Approve ${icon('check')}</button><button class="btn" data-act="decide" data-id="${r.id}" data-v="0">Decline</button>`;
    if (r.status === 'approved') acts = (recv ? `<button class="btn pink" data-act="returned" data-id="${r.id}">Mark returned</button>` : '') + `<button class="btn" data-act="cancel-req" data-id="${r.id}">Cancel</button>`;
    if (!recv && r.status === 'pending') acts = `<button class="btn" data-act="cancel-req" data-id="${r.id}">Withdraw</button>`;
    acts += `<button class="btn" data-act="open-chat" data-id="${other}">Message</button>`;
    h += `<article class="req"><div class="req-top"><img src="${photoOf(it)}" alt="">
      <div class="grow"><div class="spread" style="align-items:flex-start"><button class="linkish" style="color:var(--ink);text-align:left" data-act="open-item" data-id="${it.id}"><b>${esc(it.title)}</b></button><span class="tag ${st.k}">${st.t.toLowerCase()}</span></div>
      <div class="owner" style="margin-top:6px">${av(other, 'sm')}<button class="linkish" style="color:var(--ink)" data-act="open-user" data-id="${other}">${esc(nameOf(other))}</button></div><div class="req-kvs"><div class="kv"><span>Pickup</span>${fmtLong(r.start)}</div><div class="kv"><span>Return by</span>${fmtLong(r.end)}</div><div class="kv"><span>Washing</span>${CARE[it.care]}</div></div></div></div>
      <div class="req-body">
      ${recv && r.status === 'pending' ? '<p class="hint" style="margin:6px 0 0">Approval reserves these dates.</p>' : ''}
      ${clash.length ? `<div class="note warn">Overlaps with ${clash.map(x => esc(firstName(x.borrower)) + ' (' + drange(x.start, x.end) + ')').join(', ')}. Approving this one declines the other.</div>` : ''}
      ${st.k === 'overdue' ? `<div class="note">This was due back ${fmt(r.end)}.</div>` : ''}${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}</div>
      <div class="req-acts">${acts}</div></article>`;
  });
  $('#main').innerHTML = h + '</div>';
}

/* ---------- messages ---------- */
function relTime(t) {
  if (!t) return '';
  const d = new Date(t), now = new Date(), days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days === 0) return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday:'short' });
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function convContext(other) {
  const r = DB.requests.filter(x => (x.owner === V() && x.borrower === other) || (x.owner === other && x.borrower === V())).sort((a, b) => b.created - a.created)[0];
  if (!r) return '';
  const it = getItem(r.item); if (!it) return '';
  return `<div class="ctx">${esc(it.title)} · Request ${reqStatus(r).t.toLowerCase()} · ${drange(r.start, r.end)} · ${CARE[it.care]}</div>`;
}
function renderMessages() {
  const convs = DB.convs.filter(c => c.members.includes(V())).sort((a, b) => (b.msgs.at(-1)?.t || 0) - (a.msgs.at(-1)?.t || 0));
  const cur = convs.find(c => c.id === view.conv);
  const other = c => c.members.find(m => m !== V());
  if (cur) {
    const o = other(cur);
    $('#main').innerHTML = `<div class="thread-head">${backBtn('conv-back', '', 'aria-label="Back to messages"')}${av(o)}<button class="linkish" style="color:var(--ink)" data-act="open-user" data-id="${o}"><b>${esc(U(o).name)}</b></button></div>
      <div class="daydiv">Today</div>
      <div class="bubbles" id="tbody">${cur.msgs.map(m => m.sys ? `<div class="sysmsg">${esc(m.text)}</div>` : `<div class="bubble ${m.from === V() ? 'mine' : ''}">${esc(m.text)}</div>`).join('') || '<p class="muted b sm" style="text-align:center">Say hi and plan the pickup.</p>'}</div>
      <form class="composer" id="composer"><input type="text" id="msgInput" placeholder="Message ${esc(firstName(o))}…" autocomplete="off" aria-label="Message"><button class="sendbtn" type="submit" aria-label="Send">${icon('arrowUp')}</button></form>`;
    requestAnimationFrame(() => scrollScreen('bottom'));
    return;
  }
  $('#main').innerHTML = `<h1 class="h1" style="font-size:38px;margin:10px 0 16px">Messages</h1>
    <div class="stack">${convs.length ? convs.map(c => { const o = other(c), last = c.msgs.filter(m => !m.sys).at(-1) || c.msgs.at(-1);
      return `<button class="conv" data-act="conv" data-id="${c.id}">${av(o)}<span class="who"><span class="spread"><b>${esc(U(o).name)}</b><span class="xs b muted">${relTime(last?.t)}</span></span>
        <div class="last">${last ? esc((last.from === V() ? 'You: ' : '') + last.text) : 'Say hi'}</div>${convContext(o)}</span></button>`; }).join('')
    : emptyCard('No conversations yet', 'Message a friend from their closet or from a piece.')}</div>`;
}

/* ---------- item page ---------- */
function calHTML(item, interactive) {
  const first = new Date(cal.y, cal.m, 1), days = new Date(cal.y, cal.m + 1, 0).getDate(), earliest = interactive ? earliestStart() : null;
  const pendDays = !interactive ? DB.requests.filter(r => r.item === item.id && r.status === 'pending') : [];
  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="dow">${d}</span>`).join('');
  for (let i = 0; i < (first.getDay() + 6) % 7; i++) cells += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const ds = iso(new Date(cal.y, cal.m, d)), st = dayState(item, ds, earliest);
    let cls = st;
    if (sel.start && (ds === sel.start || ds === sel.end)) cls += ' sel';
    else if (sel.start && sel.end && ds > sel.start && ds < sel.end) cls += ' inrange';
    if (ds === TODAY) cls += ' today';
    if (pendDays.some(r => ds >= r.start && ds <= r.end) && st !== 'booked') cls += ' pend';
    const can = interactive && st === 'open';
    const label = { past:'too soon to request', off:'unavailable', booked:'reserved', open:'available' }[st];
    cells += `<button class="d ${cls}" ${can ? `data-act="cal-day" data-d="${ds}"` : 'disabled'} aria-label="${fmtLong(ds)}, ${label}">${d}</button>`;
  }
  return `<div class="cal"><div class="cal-head"><button class="cal-nav" data-act="cal-prev" aria-label="Previous month">${icon('left')}</button>
    <b>${first.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</b>
    <span class="b xs muted">${interactive ? 'Tap start & end dates' : ''}</span><button class="cal-nav" data-act="cal-next" aria-label="Next month">${icon('right')}</button></div>
    <div class="cal-grid">${cells}</div>
    <div class="legend"><span><i style="background:#e3f6f0"></i>Available</span><span><i style="background:var(--pink-soft)"></i>Reserved</span>${interactive ? '<span><i style="background:var(--rasp)"></i>Selected</span>' : '<span><i style="background:var(--rasp);border-radius:50%"></i>Pending</span>'}<span><i style="background:var(--gray-day)"></i>Unavailable</span></div></div>`;
}
function selSummary(item) {
  if (!sel.start) return '<p class="hint" style="margin-top:10px">Pick a start date, then an end date. Requests must be sent at least 24 hours before pickup.</p>';
  const end = sel.end || sel.start;
  const others = DB.requests.filter(r => r.item === item.id && r.status === 'pending' && r.borrower !== V() && overlaps(sel.start, end, r.start, r.end)).length;
  return `<div class="card" style="margin-top:12px"><div class="kv"><span>Pick up</span>${fmtLong(sel.start)}</div><div class="kv"><span>Agreed return</span>${fmtLong(end)}</div>
      <p class="hint" style="margin:4px 0 0">Request at least 24 hours before pickup.${others ? ` ${others} other request${others > 1 ? 's overlap' : ' overlaps'} these dates; ${esc(firstName(item.owner))} picks who gets it.` : ''}</p></div>
    <div class="card pale" style="margin-top:12px"><div class="row b">${icon('droplet')}Washing</div><div class="b sm" style="margin-top:4px">${CARE[item.care]}.</div></div>`;
}
function openItem(id) {
  const it = getItem(id); if (!it || !canSee(V(), it)) { toast("You don't have access to that piece."); return; }
  const mine = it.owner === V();
  const start = parseISO(mine ? TODAY : (earliestStart() > it.availFrom ? earliestStart() : it.availFrom));
  cal = { y:start.getFullYear(), m:start.getMonth() }; sel = { start:null, end:null };
  const bookings = DB.requests.filter(r => r.item === id && ['pending', 'approved'].includes(r.status));
  const sharedIn = groupsOf(V()).filter(g => it.groups.includes(g.id)).map(g => g.name)[0];
  modal(`${backBtn('close-modal', mine ? 'My closet' : 'Back')}
    <div class="photo-card" style="margin-top:10px"><img src="${photoOf(it)}" alt="${esc(it.title)}"></div>
    <h1 class="item-title">${esc(it.title)}</h1>
    <div class="meta">${esc(it.brand)} · Size ${esc(it.size)} · ${esc(it.color)}</div>
    <div class="owner" style="margin-top:10px;font-size:15px">${av(it.owner, 'sm')}<button class="linkish" style="color:var(--ink);font-size:15px" data-act="open-user" data-id="${it.owner}">${esc(nameOf(it.owner))}</button>${sharedIn ? `<span class="muted sm">· ${esc(sharedIn)}</span>` : ''}</div>
    <p class="desc">${esc(it.desc)}</p>
    <div class="chips"><span class="chip">${esc(it.type)}</span><span class="chip">${esc(it.style)}</span><span class="chip">${esc(it.color)}</span></div>
    <div class="b muted sm" style="margin:14px 0 8px">Lending ${drange(it.availFrom, it.availTo)}</div>
    <div id="calWrap">${calHTML(it, !mine)}</div>
    ${mine ? `<div class="label">Bookings</div>${bookings.length ? `<div class="card" style="padding:6px 14px">${bookings.map(r => `<div class="kv"><span>${r.borrower && U(r.borrower) ? esc(nameOf(r.borrower)) : 'Someone'} · ${drange(r.start, r.end)}</span><span class="tag ${reqStatus(r).k}">${reqStatus(r).t.toLowerCase()}</span></div>`).join('')}</div>` : '<p class="hint">No upcoming bookings.</p>'}
        <div class="cta"><button class="btn primary block lg" data-act="edit-item" data-id="${it.id}">${icon('pencil')}Edit listing</button></div>`
      : `<div id="selSum">${selSummary(it)}</div>
        <div class="cta"><button class="btn pink block lg" data-act="send-request" data-id="${it.id}" id="reqBtn" ${sel.start ? '' : 'disabled'}>Send request to ${esc(firstName(it.owner))} ${icon('send')}</button>
        <button class="btn block" style="margin-top:10px" data-act="open-chat" data-id="${it.owner}">${icon('message')}Message ${esc(firstName(it.owner))}</button></div>`}`);
  modal.item = id;
}
function refreshCal() {
  const it = getItem(modal.item); if (!it) return;
  const mine = it.owner === V();
  $('#calWrap').innerHTML = calHTML(it, !mine);
  if (!mine) { $('#selSum').innerHTML = selSummary(it); $('#reqBtn').disabled = !sel.start; }
}

/* ---------- add / edit a piece ---------- */
function uploadInner() {
  const src = ed.photo || (ed.id ? photoOf(ed) : null);
  return src ? `<img src="${src}" alt="Product photo">` : `<span class="plus">+</span><span class="b sm">Add a product photo</span>`;
}
function openEditor(id) {
  const it = id ? getItem(id) : null;
  if (it && it.owner !== V()) { toast('Only the owner can edit this listing.'); return; }
  ed = it ? { ...it, groups:[...it.groups] } : { id:null, title:'', type:'', color:'', brand:'', size:'', style:'', desc:'', care:'wash', friends:true, groups:[], photo:null, availFrom:TODAY, availTo:addDays(TODAY, 60), ai:false };
  deleteArmed = false;
  const pick = (idv, label, arr, v) => `<div class="pickrow"><select class="chip ${v ? 'on' : ''}" id="${idv}" aria-label="${label}"><option value="">${label}</option>${arr.map(x => `<option ${v === x ? 'selected' : ''}>${x}</option>`).join('')}</select>${icon('pencil', 'chev')}</div>`;
  modal(`${backBtn('close-modal', 'My closet')}
    <div class="label" style="font-size:20px">Photos</div>
    <label class="upload ${ed.photo || it ? 'has' : ''}" id="uploadBox">${uploadInner()}<input class="vh" type="file" accept="image/png,image/jpeg,image/webp" id="photoIn"></label>
    <button class="btn link sm" data-act="sample-photo">No photo handy? Use a sample</button>
    <label class="field" style="margin-top:12px"><span>Item name</span><span class="with-icon"><input class="input" id="e_title" value="${esc(ed.title)}" maxlength="60" placeholder="Enter item name">${icon('pencil')}</span></label>
    <label class="field" style="margin-top:12px"><span>Description${ed.ai ? '<span class="ai-chip">AI suggested · editable</span>' : ''}</span><textarea class="textarea" id="e_desc" maxlength="300" placeholder="Enter description here …">${esc(ed.desc)}</textarea></label>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="clear-desc">Clear</button><button class="btn sm primary" data-act="ai-retry">${icon('rotate')}Regenerate</button></div>
    <div class="ai-box" id="aiBox">${ed.ai ? aiDoneText() : `<b>${aiName()}</b> suggests the name, description, type, color, and style after you add a photo.`}</div>
    <div class="label">Info</div>
    ${pick('e_type', 'Item Type', TYPES, ed.type)}${pick('e_color', 'Color', Object.keys(COLORS), ed.color)}${pick('e_style', 'Style', STYLES, ed.style)}
    <div class="row" style="flex-wrap:nowrap;margin-top:8px"><label class="field grow"><span>Brand</span><input class="input" id="e_brand" value="${esc(ed.brand)}" maxlength="40" placeholder="Enter brand …"></label>
      <label class="field" style="width:110px"><span>Size</span><select class="selectbox" id="e_size"><option value="">Size</option>${SIZES.map(x => `<option ${ed.size === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <div class="card dashed" style="margin-top:16px"><div class="b" style="margin-bottom:8px">Available to lend</div>
      <div class="row" style="flex-wrap:nowrap"><label class="field grow"><span class="sm muted">From</span><input class="input" type="date" id="e_from" value="${ed.availFrom}"></label><label class="field grow"><span class="sm muted">Until</span><input class="input" type="date" id="e_to" value="${ed.availTo}"></label></div>
      <label class="field" style="margin-top:10px"><span class="sm muted">Washing preference</span><select class="selectbox" id="e_care">${Object.entries(CARE).map(([k, v]) => `<option value="${k}" ${ed.care === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <div class="label">Who can see it</div>
    <div class="card" style="padding:4px 14px"><label class="check"><input type="checkbox" id="e_friends" ${ed.friends ? 'checked' : ''}>All my friends</label>
      ${groupsOf(V()).map(g => `<label class="check"><input type="checkbox" data-eg="${g.id}" ${ed.groups.includes(g.id) ? 'checked' : ''}>${esc(g.name)}</label>`).join('')}</div>
    <p class="hint" style="margin-top:6px">Unchecked means private. Only you will see it.</p>
    <div class="cta"><button class="btn primary block lg" data-act="save-item">Save</button></div>
    ${it ? '<button class="btn block" style="margin-top:10px;color:var(--red)" data-act="delete-item" id="delBtn">Delete piece</button>' : ''}`);
}

/* ---------- full-screen pages (replace the old pop-up) ---------- */
function modal(html, cls = '') {
  $('#modalRoot').innerHTML = `<div class="overlay"><div class="page ${cls}" role="dialog" aria-modal="true">${html}</div></div>`;
  $('#modalRoot .back')?.focus({ preventScroll:true });
}
function closeModal() { $('#modalRoot').innerHTML = ''; modal.item = null; ed = null; shareCtx = null; }

/* ---------- extra actions for the new screens ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const act = b.dataset.act;
  switch (act) {
    case 'nav': closeModal(); break;
    case 'friends-page': view.sub = 'friends'; view.user = null; render(); window.scrollTo(0, 0); break;
    case 'addfriends-page': view.sub = 'addfriends'; render(); window.scrollTo(0, 0); break;
    case 'closet-back': view.sub = view.sub === 'addfriends' ? 'friends' : view.user ? 'friends' : null; view.user = null; render(); break;
    case 'group-create-page': view.sub = 'create'; view.group = null; render(); setTimeout(() => $('#newGroup')?.focus(), 30); break;
    case 'group-join-page': view.sub = 'join'; view.group = null; render(); setTimeout(() => $('#joinCode')?.focus(), 30); break;
    case 'groups-back': view.sub = null; view.group = null; render(); break;
    case 'open-group': view.sub = null; groupQ = ''; break; // app.js opens the group
    case 'sgroup': F.group = b.dataset.id || ''; renderExplore(); break;
    case 'clear-desc': { const d = $('#e_desc'); if (d) { d.value = ''; d.focus(); } break; }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'friendQ') { friendQ = e.target.value; renderFriendList(); }
  if (e.target.id === 'gq') { groupQ = e.target.value; const g = DB.groups.find(x => x.id === view.group); if (g) renderGroupItems(g); }
  if (e.target.id === 'joinCode') updateJoinPreview();
});
document.addEventListener('change', e => {
  if (e.target.id === 'fbrand') { F.brand = e.target.value; renderResults(); }
  if (['ftype', 'fsize', 'fbrand', 'fcolor', 'fstyle'].includes(e.target.id)) e.target.classList.toggle('on', !!e.target.value);
  if (['e_type', 'e_color', 'e_style'].includes(e.target.id)) e.target.classList.toggle('on', !!e.target.value);
});

/* After the demo "create group" in app.js, open the new group (live.js does the same for the server). */
view.sub = view.sub || null;
F.group = F.group || ''; F.brand = F.brand || '';
render();
/* ---------- create account page ---------- */
IC.camera = '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>';
IC.eye = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
IC.eyeoff = '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a17 17 0 0 1-2.2 3.3M6.6 6.6C3.4 8.6 2 12 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>';
IC.back = '<path d="M19 12H5M12 19l-7-7 7-7"/>';
let signupOpen = false, suPhoto = null;
const baseStart = renderStart;
renderStart = function () {
  if (signupOpen) return renderSignup();
  baseStart();
  document.querySelectorAll('.welcome .btn.link[data-act="signin"]').forEach(b => { b.dataset.act = 'signup-page'; });
};
const suDropInner = () => (suPhoto ? `<img src="${suPhoto}" alt="Your profile picture">` : '') +
  `<span class="su-addbtn">${icon('camera')}${suPhoto ? 'Change' : 'Add photo'}</span>`;
function renderSignup() {
  $('#main').innerHTML = `<section class="signup">
    <button class="back su-back" data-act="signup-back">${icon('back')}Back</button>
    <div class="su-head">${wordmark(.85)}<h1>Create your account</h1></div>
    <div class="su-f"><span class="su-l">Profile picture</span>
      <label class="su-drop ${suPhoto ? 'has' : ''}" id="su_drop" for="su_photo" title="Click or drop a photo">${suDropInner()}</label>
      <input type="file" id="su_photo" accept="image/png,image/jpeg,image/webp" hidden>
    </div>
    <label class="su-f"><span class="su-l">Name</span><input id="su_name" autocomplete="name" placeholder="Your full name" maxlength="40"><small class="su-err" data-for="name"></small></label>
    <label class="su-f"><span class="su-l">Username</span><input id="su_user" autocomplete="username" placeholder="@yourusername" maxlength="21" autocapitalize="none" spellcheck="false"><small class="su-err" data-for="user"></small></label>
    <label class="su-f"><span class="su-l">Email</span><input id="su_email" type="email" autocomplete="email" placeholder="you@example.com"><small class="su-err" data-for="email"></small></label>
    <label class="su-f"><span class="su-l">Password</span><span class="su-pw"><input id="su_pw" type="password" autocomplete="new-password" placeholder="Create a password"><button type="button" class="su-eye" data-act="su-eye" aria-label="Show password">${icon('eye')}</button></span><small class="su-hint" id="su_pwhint">Use at least 8 characters.</small></label>
    <button class="btn plum block su-go" data-act="signup-submit">Create account</button>
    <p class="su-fine">By creating an account, you agree to our<br><a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
    <p class="su-have">Already have an account? <button class="su-link" data-act="signin">Sign in</button></p>
  </section>`;
}
async function setSignupPhoto(file) {
  if (!file) return;
  try { suPhoto = await readPhoto(file); const d = $('#su_drop'); if (d) { d.classList.add('has'); d.innerHTML = suDropInner(); } }
  catch (err) { toast(err.message === 'size' ? 'That photo is over 8 MB. Try a smaller one.' : 'Use a JPG, PNG, or WebP photo.'); }
}
function submitSignup() {
  const v = id => ($('#' + id)?.value || '').trim();
  const name = v('su_name'), user = v('su_user').replace(/^@/, ''), email = v('su_email'), pw = $('#su_pw').value;
  const errs = {};
  if (!name) errs.name = 'Add your name.';
  if (!/^[a-z0-9._]{3,20}$/.test(user)) errs.user = '3–20 characters: letters, numbers, . or _';
  else if (Object.values(DB.users).some(u => u.username === user && u.id !== 'me')) errs.user = 'That username is taken.';
  if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email.';
  document.querySelectorAll('.su-err').forEach(el => { el.textContent = errs[el.dataset.for] || ''; });
  $('#su_pwhint').classList.toggle('bad', pw.length < 8);
  if (Object.keys(errs).length || pw.length < 8) return;
  signupOpen = false;
  if (window.CS_LIVE) {  // real accounts go through Auth0 / the backend
    try { localStorage.setItem('cs-signup', JSON.stringify({ name, username:user, photo:suPhoto })); } catch (e) {}
    const t = document.createElement('button'); t.dataset.act = 'signin'; t.hidden = true; document.body.appendChild(t); t.click(); t.remove(); return;
  }
  Object.assign(DB.users.me, { name, username:user, photo:suPhoto });
  DB.viewer = 'me'; DB.signedIn = true; suPhoto = null; save(); render(); scrollScreen(0);
  toast(`Welcome, ${name.split(' ')[0]}!`);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  switch (b.dataset.act) {
    case 'signin': signupOpen = false; break;
    case 'signup-page': signupOpen = true; render(); scrollScreen(0); break;
    case 'signup-back': signupOpen = false; render(); scrollScreen(0); break;
    case 'su-eye': { const i = $('#su_pw'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = icon(show ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); break; }
    case 'signup-submit': submitSignup(); break;
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'su_user') t.value = t.value.toLowerCase().replace(/[^a-z0-9._@]/g, '').replace(/(?!^)@/g, '');
  if (t.id === 'su_pw') { const h = $('#su_pwhint'); h.classList.remove('bad'); h.classList.toggle('ok', t.value.length >= 8); }
  const er = t.closest && t.closest('.su-f')?.querySelector('.su-err'); if (er) er.textContent = '';
});
document.addEventListener('change', e => { if (e.target.id === 'su_photo') setSignupPhoto(e.target.files[0]); });
/* drag & drop a photo onto the circle */
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => {
  if (!signupOpen) return; e.preventDefault(); $('#su_drop')?.classList.toggle('over', !!e.target.closest?.('#su_drop'));
}));
document.addEventListener('dragleave', e => { if (e.target.id === 'su_drop') e.target.classList.remove('over'); });
document.addEventListener('drop', e => {
  if (!signupOpen) return; e.preventDefault(); $('#su_drop')?.classList.remove('over');
  if (e.target.closest?.('#su_drop')) setSignupPhoto(e.dataTransfer.files[0]);
});
/* show the profile photo on your own closet page */
const baseRender = render;
render = function () {
  baseRender();
  const me = DB && DB.users && DB.users.me;
  if (me && me.photo && DB.signedIn && view.tab === 'closet' && (!view.user || view.user === 'me'))
    document.querySelectorAll('.profile .av').forEach(a => { a.innerHTML = `<img src="${me.photo}" alt="">`; });
};
if (DB && !DB.signedIn) render();  // redraw the welcome screen so the "Create account" link works
/* ---------- my closet: real dress photos instead of drawings ---------- */
const MY_PHOTOS = {
  i1: { photo:'img/blue-halter.jpg', title:'Blue jacquard halter dress', type:'Dress', color:'Blue', brand:'Thrifted', style:'Going out', desc:'Light blue jacquard mini with a halter neck and a bow tie in the back. Puffy skirt, very princess.' },
  i2: { photo:'img/pink-bubble.jpg', title:'Pink bubble mini dress', type:'Dress', color:'Pink', brand:'Zara', style:'Formal', desc:'Strapless pink taffeta with a ruched top and a bubble skirt. Formal or birthday energy.' },
  i3: { photo:'img/blue-flower.jpg', title:'Blue 3D flower mini dress', type:'Dress', color:'Blue', brand:'No brand', style:'Going out', desc:'Baby blue mini with a deep V and 3D satin flowers with little rhinestones. Zips in the back.' },
};
const HIDE_ITEMS = ['i4'];  // the sneakers drawing: no photo for it, so take it out
const UNDO = {  // only used if the older version of this block changed friends' items
  i5: { photo:null, title:'Red mini dress', type:'Dress', color:'Red', desc:'Bright red mini dress with a square neckline. A game-day and birthday favorite.' },
  i9: { photo:null, title:'Green satin midi skirt', type:'Skirt', color:'Green', desc:'Emerald satin midi skirt with a bias cut. Pairs well with a fitted top.' },
};
if (!window.CS_LIVE && DB && DB.items) {
  let changed = false;
  for (const [id, p] of Object.entries(MY_PHOTOS)) {
    const it = DB.items.find(x => x.id === id);
    if (it && (!it.photo || it.photo.startsWith('img/')) && it.photo !== p.photo) { Object.assign(it, p); changed = true; }
  }
  for (const [id, p] of Object.entries(UNDO)) {
    const it = DB.items.find(x => x.id === id);
    if (it && it.photo && it.photo.startsWith('img/')) { Object.assign(it, p); changed = true; }
  }
  if (DB.items.some(x => HIDE_ITEMS.includes(x.id))) {
    DB.items = DB.items.filter(x => !HIDE_ITEMS.includes(x.id));
    DB.requests = DB.requests.filter(r => !HIDE_ITEMS.includes(r.item));
    changed = true;
  }
  if (changed) { save(); render(); }
}

