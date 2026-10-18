/* ClosetShare live mode: connects the app to the FastAPI backend.
   Loaded after app.js. If config.js has no API URL, or the server is down, the offline demo keeps running. */
(function () {
  if (!API_URL) return;

  const AUTH0 = window.CLOSETSHARE_AUTH0 || {};
  const USE_AUTH0 = !!(AUTH0.domain && AUTH0.clientId);
  const DEV_USERS = [['me', 'Alex Nguyen'], ['maya', 'Maya Chen'], ['jordan', 'Jordan Lee'], ['priya', 'Priya Patel'], ['sam', 'Sam Rivera'], ['ava', 'Ava Brooks'], ['leo', 'Leo Kim']];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };
  let devUser = store.get('cs-dev-user') || 'me';
  let auth0Client = null;
  let live = false;
  const S = x => (x == null ? null : String(x));
  const emptyDB = () => ({ signedIn:false, viewer:null, users:{}, friendships:[], groups:[], items:[], requests:[], convs:[] });

  /* ---------- HTTP ---------- */
  async function authHeaders() {
    if (USE_AUTH0) return { Authorization: 'Bearer ' + await auth0Client.getTokenSilently() };
    return { 'X-Dev-User': devUser };
  }
  async function api(path, { method = 'GET', body, form } = {}) {
    const headers = await authHeaders();
    const opts = { method, headers };
    if (form) opts.body = form;
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(API_URL + path, opts);
    if (!res.ok) {
      let msg = `Something went wrong (${res.status}).`;
      try { const j = await res.json(); msg = typeof j.detail === 'string' ? j.detail : (j.detail?.[0]?.msg || msg); } catch (e) {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  /* ---------- map the server's data into the shape the screens use ---------- */
  function mapBootstrap(b) {
    const users = {};
    b.users.forEach(u => {
      users[S(u.id)] = { id:S(u.id), name:u.display_name, username:u.username, hue:HUES[u.id % HUES.length],
        stats:{ items:u.item_count, friends:u.friend_count, groups:u.group_count } };
    });
    const abs = url => (url ? (url.startsWith('http') ? url : API_URL + url) : null);
    return {
      signedIn:true, viewer:S(b.me.id), users,
      friendships: b.friendships.map(f => ({ id:f.id, a:S(f.a), b:S(f.b), status:f.status })),
      groups: b.groups.map(g => ({ id:S(g.id), name:g.name, owner:S(g.owner), token:g.token || '',
        members:g.members.map(m => ({ uid:S(m.uid), status:m.status })) })),
      items: b.items.map(i => ({ id:S(i.id), owner:S(i.owner_id), title:i.title, type:i.item_type, color:i.color, brand:i.brand,
        size:i.size, style:i.style, desc:i.description, care:i.care, friends:!!i.visible_to_friends,
        groups:(i.group_ids || []).map(S), photo:abs(i.photo_url), availFrom:i.available_from, availTo:i.available_until })),
      requests: b.requests.map(r => ({ id:S(r.id), item:S(r.item), borrower:S(r.borrower), owner:S(r.owner), start:r.start, end:r.end,
        status:r.status, note:r.note || '', created:r.created ? Date.parse(r.created) : 0 })),
      convs: b.conversations.map(c => ({ id:S(c.id), members:c.members.map(S),
        msgs:c.msgs.map(m => ({ from:m.from == null ? 'sys' : S(m.from), text:m.text, t:m.t ? Date.parse(m.t) : 0, sys:m.from == null })) })),
    };
  }
  async function sync() { DB = mapBootstrap(await api('/api/bootstrap')); }
  async function refresh() { await sync(); render(); }

  /* ---------- actions that go to the server ---------- */
  async function saveItemLive() {
    const v = id => $(id).value.trim();
    const d = { title:v('#e_title'), desc:v('#e_desc'), type:v('#e_type'), brand:v('#e_brand'), size:v('#e_size'), color:v('#e_color'),
      style:v('#e_style'), care:v('#e_care'), from:v('#e_from'), to:v('#e_to'), friends:$('#e_friends').checked,
      groups:[...document.querySelectorAll('[data-eg]')].filter(x => x.checked).map(x => Number(x.dataset.eg)) };
    const missing = ['title', 'type', 'size', 'color', 'style'].filter(k => !d[k]);
    if (missing.length) return toast('Add the ' + missing.join(', ') + ' before saving.');
    if (!d.from || !d.to || d.from > d.to) return toast('Pick lending dates where "From" comes before "Until".');
    if (!ed.id && !ed.newPhoto) return toast('Upload a product photo or use a sample.');
    const body = { title:d.title, description:d.desc, item_type:d.type, brand:d.brand, size:d.size, color:d.color, style:d.style, care:d.care,
      visible_to_friends:d.friends, group_ids:d.groups, available_from:d.from, available_until:d.to };
    if (ed.newPhoto) {
      const fd = new FormData(); fd.append('file', await toJpegBlob(ed.photo), 'photo.jpg');
      body.photo_key = (await api('/api/uploads', { method:'POST', form:fd })).photo_key;
    }
    const editing = !!ed.id;
    if (editing) await api('/api/items/' + ed.id, { method:'PATCH', body });
    else await api('/api/items', { method:'POST', body });
    closeModal(); await sync(); go('closet'); toast(editing ? 'Listing updated' : 'Added to your closet');
  }

  const ACTS = {
    async signin() {
      if (USE_AUTH0) return auth0Client.loginWithRedirect();
      store.set('cs-live-signed', '1'); await refresh(); toast(`Signed in as ${U(V()).name}`);
    },
    async signout() {
      store.set('cs-live-signed', null);
      if (USE_AUTH0) return auth0Client.logout({ logoutParams:{ returnTo:location.origin + location.pathname } });
      DB = emptyDB(); authScreen = 'start'; render(); window.scrollTo(0, 0);
    },
    'save-item': saveItemLive,
    async 'delete-item'(b) {
      if (!deleteArmed) { deleteArmed = true; b.textContent = 'Tap again to delete'; return; }
      await api('/api/items/' + ed.id, { method:'DELETE' }); closeModal(); await sync(); go('closet'); toast('Listing deleted');
    },
    async 'send-request'(b, id) {
      await api('/api/borrow-requests', { method:'POST', body:{ item_id:Number(id), start_date:sel.start, end_date:sel.end || sel.start } });
      const owner = getItem(id).owner; closeModal(); await sync(); view.reqTab = 'sent'; go('requests'); toast(`Request sent to ${firstName(owner)}`);
    },
    async decide(b, id) {
      const approve = b.dataset.v === '1', before = DB.requests.filter(r => r.status === 'pending').length;
      await api(`/api/borrow-requests/${id}/decision`, { method:'PATCH', body:{ approve } });
      await refresh();
      const auto = before - DB.requests.filter(r => r.status === 'pending').length - 1;
      toast(!approve ? 'Request declined' : auto > 0 ? `Approved. ${auto} overlapping request${auto > 1 ? 's were' : ' was'} declined automatically.` : 'Approved. Those dates are now blocked.');
    },
    async 'cancel-req'(b, id) { await api(`/api/borrow-requests/${id}/cancel`, { method:'POST' }); await refresh(); toast('Canceled. The dates are free again.'); },
    async returned(b, id) { await api(`/api/borrow-requests/${id}/returned`, { method:'POST' }); await refresh(); toast('Marked as returned'); },
    async 'open-chat'(b, id) {
      if (id === V()) return;
      const c = await api('/api/conversations/with/' + encodeURIComponent(U(id).username), { method:'POST' });
      closeModal(); await sync(); go('messages', { conv:S(c.id) }); setTimeout(() => $('#msgInput')?.focus(), 50);
    },
    async 'friend-add'(b, id) { await api('/api/friends/requests', { method:'POST', body:{ username:U(id).username } }); await refresh(); toast('Friend request sent'); },
    async 'friend-accept'(b, id) {
      const f = DB.friendships.find(x => x.a === id && x.b === V() && x.status === 'pending'); if (!f) return;
      await api('/api/friends/requests/' + f.id, { method:'PATCH', body:{ approve:true } }); await refresh(); toast(`You and ${firstName(id)} are now friends`);
    },
    async 'friend-decline'(b, id) {
      const f = DB.friendships.find(x => x.a === id && x.b === V() && x.status === 'pending'); if (!f) return;
      await api('/api/friends/requests/' + f.id, { method:'PATCH', body:{ approve:false } }); await refresh();
    },
    async 'create-group'() {
      const name = $('#newGroup').value.trim(); if (!name) { toast('Give your group a name'); $('#newGroup').focus(); return; }
      const g = await api('/api/groups', { method:'POST', body:{ name, requires_approval: $('#newGroupApproval') ? $('#newGroupApproval').checked : true } });
      await sync(); view.group = S(g.id); render(); openShareModal(S(g.id), true);
    },
    async 'join-group'() {
      const invite = $('#joinCode').value.trim(); if (!invite) return toast('Paste an invite link or code');
      const g = await api('/api/groups/join', { method:'POST', body:{ invite } });
      await sync();
      if (g.my_status === 'approved') { view.group = S(g.id); render(); openShareModal(S(g.id), true); }
      else { render(); toast(`Request sent. ${g.owner.display_name.split(' ')[0]} will approve it.`); }
    },
    async 'approve-member'(b, id) { await api(`/api/groups/${b.dataset.g}/members/${id}`, { method:'PATCH', body:{ approve:true } }); await refresh(); toast(`${U(id).name} joined the group`); },
    async 'deny-member'(b, id) { await api(`/api/groups/${b.dataset.g}/members/${id}`, { method:'PATCH', body:{ approve:false } }); await refresh(); toast('Request declined'); },
    async 'leave-group'(b, id) {
      const name = DB.groups.find(g => g.id === id)?.name || 'the group';
      await api(`/api/groups/${id}/members/me`, { method:'DELETE' }); view.group = null; await refresh(); toast(`You left ${name}`);
    },
    async 'share-save'() {
      const gid = shareCtx.gid, ids = [...shareCtx.picked].map(Number);
      await api(`/api/groups/${gid}/sharing`, { method:'PUT', body:{ item_ids:ids } });
      closeModal(); await refresh(); toast(`Sharing ${ids.length} item${ids.length === 1 ? '' : 's'} with the group`);
    },
    async reset() { toast('Reset only works in the offline demo. To reset the server, run: python -m app.seed'); },
  };

  /* Capture-phase listeners run before app.js's demo handlers and stop them. */
  document.addEventListener('click', e => {
    if (!live) return;
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const fn = ACTS[b.dataset.act]; if (!fn) return;
    e.stopPropagation(); e.preventDefault();
    const keepEnabled = b.dataset.act === 'delete-item' && !deleteArmed;
    if (!keepEnabled) b.disabled = true;
    Promise.resolve(fn(b, b.dataset.id)).catch(err => toast(err.message)).finally(() => { if (b.isConnected) b.disabled = false; });
  }, true);

  document.addEventListener('submit', async e => {
    if (!live || e.target.id !== 'composer') return;
    e.preventDefault(); e.stopPropagation();
    const inp = $('#msgInput'), text = inp.value.trim(); if (!text) return;
    inp.value = '';
    try { await api(`/api/conversations/${view.conv}/messages`, { method:'POST', body:{ body:text } }); await sync(); renderMessages(); $('#msgInput')?.focus(); }
    catch (err) { inp.value = text; toast(err.message); }
  }, true);

  document.addEventListener('change', async e => {
    if (!live || e.target.id !== 'viewerSel') return;
    e.stopPropagation();
    devUser = e.target.value; store.set('cs-dev-user', devUser); window.CS_VIEWER_SEL = devUser;
    closeModal(); view = { ...view, user:null, group:null, conv:null };
    try { await refresh(); toast(`Now signed in as ${U(V()).name}`); } catch (err) { toast(err.message); }
  }, true);

  /* Light polling so new requests and messages show up without reloading. */
  async function poll() {
    if (!DB.signedIn || document.hidden || $('#modalRoot').innerHTML || !['messages', 'requests', 'closet', 'groups'].includes(view.tab)) return;
    const sig = () => JSON.stringify([DB.requests.map(r => r.status), DB.convs.map(c => c.msgs.length), DB.friendships.map(f => f.status), DB.groups.map(g => g.members.length), DB.items.length]);
    const before = sig();
    try { await sync(); } catch (e) { return; }
    if (sig() === before) return;
    const inp = $('#msgInput'), val = inp ? inp.value : '', focused = inp && document.activeElement === inp;
    render();
    const ni = $('#msgInput'); if (ni) { ni.value = val; if (focused) ni.focus(); }
  }

  /* First Auth0 sign-in: copy the person's real name into their ClosetShare profile. */
  async function syncProfileOnce() {
    const u = await auth0Client.getUser(); if (!u) return;
    const key = 'cs-profile-synced-' + u.sub;
    if (store.get(key)) return;
    const name = (u.name && !u.name.includes('@') ? u.name : u.nickname || u.name || '').slice(0, 80);
    const handle = (u.nickname || (u.email || '').split('@')[0] || '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);
    try { if (name) await api('/api/users/me', { method:'PATCH', body:{ display_name:name } }); } catch (e) {}
    try { if (handle.length >= 3) await api('/api/users/me', { method:'PATCH', body:{ username:handle } }); } catch (e) {} // skipped if taken
    store.set(key, '1');
    await sync();
  }

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
  }

  /* ---------- boot ---------- */
  (async () => {
    try {
      const r = await fetch(API_URL + '/api/health'); if (!r.ok) throw new Error();
      const h = await r.json();
      const names = { gemini:'Gemini', openai:'OpenAI', anthropic:'Claude', groq:'Groq', openrouter:'OpenRouter', ollama:'Ollama' };
      window.CS_AI_NAME = names[(h.ai_provider || 'gemini').toLowerCase()] || 'AI';
    }
    catch (e) { toast('Server not reachable, so you are using offline demo data.'); return; }

    live = true;
    window.CS_LIVE = true;
    window.CS_AUTH_HEADERS = authHeaders;
    window.CS_HIDE_VIEWER = USE_AUTH0;
    window.CS_VIEWERS = DEV_USERS;
    window.CS_VIEWER_SEL = devUser;
    window.CS_SIGNIN_NOTE = USE_AUTH0
      ? 'You will sign in securely with Auth0.'
      : `Connected to the ClosetShare server in dev mode. You'll sign in as ${(DEV_USERS.find(u => u[0] === devUser) || DEV_USERS[0])[1]}; switch people with "Viewing as".`;
    canSee = (u, item) => !!item; // the server only sends items you're allowed to see

    DB = emptyDB(); closeModal();
    let signedIn = false;
    if (USE_AUTH0) {
      await loadScript('https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.1.3/dist/auth0-spa-js.production.js');
      auth0Client = await auth0.createAuth0Client({
        domain:AUTH0.domain, clientId:AUTH0.clientId, cacheLocation:'localstorage',
        authorizationParams:{ audience:AUTH0.audience, redirect_uri:location.origin + location.pathname },
      });
      const q = new URLSearchParams(location.search);
      if (q.has('code') && q.has('state')) { await auth0Client.handleRedirectCallback(); history.replaceState({}, '', location.pathname); }
      signedIn = await auth0Client.isAuthenticated();
    } else {
      signedIn = store.get('cs-live-signed') === '1';
    }
    if (signedIn) {
      try {
        await sync();
        if (USE_AUTH0) await syncProfileOnce();
      } catch (err) { toast(err.message); DB = emptyDB(); }
    }
    view = { tab:'closet', user:null, group:null, conv:null, reqTab:'received', explore:'clothes' };
    render();
    setInterval(poll, 6000);
  })();
})();
