// ═══════════════════════════════════════════════
//  utils.js + api.js  — shared across all pages
// ═══════════════════════════════════════════════

const API_BASE = 'http://localhost:5000/api';

// ── API client ────────────────────────────────────
const api = {
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    const sess = getSession();
    if (sess?.token) h['Authorization'] = `Bearer ${sess.token}`;
    return h;
  },
  async _req(method, path, body) {
    try {
      const opts = { method, headers: this._headers() };
      if (body) opts.body = JSON.stringify(body);
      const r = await fetch(API_BASE + path, opts);
      const data = await r.json();
      return { ok: r.ok, status: r.status, data };
    } catch (err) {
      // Fallback: use localStorage when server is offline
      console.warn('API offline, using localStorage fallback');
      return { ok: false, status: 0, data: { message: 'Server unreachable — using local data' } };
    }
  },
  get:    (p)    => api._req('GET',    p),
  post:   (p, b) => api._req('POST',   p, b),
  put:    (p, b) => api._req('PUT',    p, b),
  patch:  (p, b) => api._req('PATCH',  p, b),
  delete: (p)    => api._req('DELETE', p),
};

// ── Session helpers ───────────────────────────────
function saveSession(token, user) {
  localStorage.setItem('ef_token', token);
  localStorage.setItem('ef_user', JSON.stringify(user));
}
function getSession() {
  const token = localStorage.getItem('ef_token');
  const user  = localStorage.getItem('ef_user');
  if (!token || !user) return null;
  try { return { token, user: JSON.parse(user) }; } catch { return null; }
}
function clearSession() {
  localStorage.removeItem('ef_token');
  localStorage.removeItem('ef_user');
}
function requireAuth() {
  const s = getSession();
  if (!s) { location.href = 'login.html'; return null; }
  return s.user;
}

// ── Local data (offline / demo fallback) ─────────
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } }
function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function seedDemoData() {
  if (lsGet('ef_events').length > 0) return;
  const cities = [
    { name:'Delhi',     lat:28.61, lng:77.20 },
    { name:'Mumbai',    lat:19.07, lng:72.87 },
    { name:'Bengaluru', lat:12.97, lng:77.59 },
    { name:'Hyderabad', lat:17.38, lng:78.47 },
    { name:'Chennai',   lat:13.08, lng:80.27 },
    { name:'Pune',      lat:18.52, lng:73.85 },
    { name:'Kolkata',   lat:22.57, lng:88.36 },
    { name:'Ahmedabad', lat:23.02, lng:72.57 },
  ];
  const events = [
    { _id:'e1', title:'AI & Machine Learning Masterclass',  description:'Neural networks, transformers, and production ML deployment.', date:'2026-06-15', speaker:'Dr. Ananya Sharma',  category:'tech',     totalSeats:80,  bookedSeats:62, meetingLink:'https://meet.google.com/abc', ...cities[0], isFeatured:true  },
    { _id:'e2', title:'Full-Stack Web Dev Bootcamp',        description:'React 19, Node.js, MongoDB from zero to deployed.',            date:'2026-06-22', speaker:'Rahul Mehta',        category:'tech',     totalSeats:60,  bookedSeats:30, meetingLink:'https://zoom.us/j/123',       ...cities[1], isFeatured:true  },
    { _id:'e3', title:'Cyber Security Seminar 2026',        description:'Zero-day threats, pentesting, secure architecture patterns.',   date:'2026-06-28', speaker:'Ankit Verma',        category:'tech',     totalSeats:100, bookedSeats:95, meetingLink:'https://teams.ms/abc',        ...cities[2], isFeatured:false },
    { _id:'e4', title:'UI/UX Design Systems Masterclass',   description:'Figma, design tokens, component libraries & user research.',   date:'2026-07-05', speaker:'Priya Nair',          category:'design',   totalSeats:50,  bookedSeats:20, meetingLink:'https://meet.google.com/xyz', ...cities[0], isFeatured:true  },
    { _id:'e5', title:'Startup Pitch & VC Funding Summit',  description:'How to pitch to investors and close your seed round.',         date:'2026-07-12', speaker:'Vikram Bose',         category:'business', totalSeats:200, bookedSeats:140,meetingLink:'https://zoom.us/j/456',       ...cities[3], isFeatured:false },
    { _id:'e6', title:'Mindfulness & Peak Performance',     description:'Science-backed focus, stress reduction, deep work mastery.',   date:'2026-07-18', speaker:'Dr. Meera Iyer',      category:'health',   totalSeats:150, bookedSeats:40, meetingLink:'https://meet.google.com/mno', ...cities[4], isFeatured:false },
    { _id:'e7', title:'Cloud Architecture with AWS',        description:'Serverless, microservices, cost-effective cloud deployments.', date:'2026-08-01', speaker:'Saurabh Kumar',        category:'tech',     totalSeats:75,  bookedSeats:55, meetingLink:'https://zoom.us/j/789',       ...cities[5], isFeatured:true  },
    { _id:'e8', title:'Product Management Essentials',      description:'From ideation to launch — OKRs, roadmaps, prioritisation.',   date:'2026-08-10', speaker:'Neha Tiwari',          category:'business', totalSeats:90,  bookedSeats:30, meetingLink:'https://teams.ms/def',        ...cities[1], isFeatured:false },
    { _id:'e9', title:'Motion Design & CSS Animation',      description:'After Effects, Lottie, CSS keyframes for modern UI.',          date:'2026-08-20', speaker:'Arjun Das',            category:'design',   totalSeats:40,  bookedSeats:12, meetingLink:'https://meet.google.com/pqr', ...cities[2], isFeatured:false },
    { _id:'e10',title:'Data Science with Python',           description:'Pandas, NumPy, Matplotlib, Scikit-learn end-to-end.',          date:'2026-09-05', speaker:'Dr. Ravi Teja',        category:'science',  totalSeats:120, bookedSeats:70, meetingLink:'https://meet.google.com/rst', ...cities[6], isFeatured:false },
    { _id:'e11',title:'Blockchain & Web3 Deep Dive',        description:'Smart contracts, DeFi, NFTs and the decentralised future.',   date:'2026-09-14', speaker:'Kiran Patel',          category:'tech',     totalSeats:60,  bookedSeats:25, meetingLink:'https://zoom.us/j/321',       ...cities[7], isFeatured:false },
    { _id:'e12',title:'Digital Marketing Masterclass',      description:'SEO, paid ads, email funnels and conversion optimisation.',   date:'2026-09-22', speaker:'Sneha Roy',            category:'business', totalSeats:180, bookedSeats:90, meetingLink:'https://teams.ms/ghi',        ...cities[0], isFeatured:false },
  ];
  lsSet('ef_events', events);

  if (!lsGet('ef_users').length) {
    lsSet('ef_users', [
      { _id:'u1', name:'Admin User',  email:'admin@eventify.com', password:'admin123456', role:'admin', city:'Delhi',   isActive:true, createdAt: new Date(Date.now()-30*86400000).toISOString() },
      { _id:'u2', name:'Demo User',   email:'demo@eventify.com',  password:'demo123456',  role:'user',  city:'Mumbai',  isActive:true, createdAt: new Date(Date.now()-15*86400000).toISOString() },
      { _id:'u3', name:'Priya Nair',  email:'priya@example.com',  password:'pass12345',   role:'user',  city:'Bengaluru', isActive:true, createdAt: new Date(Date.now()-10*86400000).toISOString() },
      { _id:'u4', name:'Rahul M',     email:'rahul@example.com',  password:'pass12345',   role:'user',  city:'Delhi',   isActive:true, createdAt: new Date(Date.now()-5*86400000).toISOString() },
    ]);
    lsSet('ef_bookings', [
      { _id:'b1', userId:'u2', eventId:'e1', status:'confirmed', bookingDate: new Date().toISOString() },
      { _id:'b2', userId:'u2', eventId:'e4', status:'confirmed', bookingDate: new Date().toISOString() },
      { _id:'b3', userId:'u3', eventId:'e2', status:'confirmed', bookingDate: new Date().toISOString() },
      { _id:'b4', userId:'u4', eventId:'e1', status:'confirmed', bookingDate: new Date().toISOString() },
      { _id:'b5', userId:'u4', eventId:'e3', status:'cancelled', bookingDate: new Date().toISOString() },
    ]);
  }
}
seedDemoData();

// ── Local-storage API shims (when backend offline) ─
const localDB = {
  getEvents(query = {}) {
    let evs = lsGet('ef_events');
    if (query.category && query.category !== 'all') evs = evs.filter(e => e.category === query.category);
    if (query.city     && query.city     !== 'all') evs = evs.filter(e => e.city?.toLowerCase().includes(query.city.toLowerCase()));
    if (query.search)  evs = evs.filter(e => e.title.toLowerCase().includes(query.search.toLowerCase()) || e.speaker.toLowerCase().includes(query.search.toLowerCase()));
    return evs;
  },
  getEvent(id)   { return lsGet('ef_events').find(e => e._id === id); },
  saveEvent(ev)  { const evs = lsGet('ef_events'); const i = evs.findIndex(e => e._id === ev._id); if (i >= 0) evs[i] = ev; else evs.push(ev); lsSet('ef_events', evs); },
  deleteEvent(id){ const evs = lsGet('ef_events').filter(e => e._id !== id); lsSet('ef_events', evs); },

  getBookings(userId)  { return lsGet('ef_bookings').filter(b => !userId || b.userId === userId); },
  saveBooking(b)       { const bs = lsGet('ef_bookings'); bs.push(b); lsSet('ef_bookings', bs); },
  cancelBooking(id)    {
    const bs = lsGet('ef_bookings');
    const b  = bs.find(x => x._id === id);
    if (b) {
      b.status = 'cancelled';
      lsSet('ef_bookings', bs);
      const evs = lsGet('ef_events');
      const ev  = evs.find(e => e._id === b.eventId);
      if (ev && ev.bookedSeats > 0) { ev.bookedSeats--; lsSet('ef_events', evs); }
    }
  },
  getUsers()  { return lsGet('ef_users').map(u => { const c = {...u}; delete c.password; return c; }); },
  getUser(id) { const u = lsGet('ef_users').find(u => u._id === id); if (!u) return null; const c = {...u}; delete c.password; return c; },

  // Auth
  login(email, password) {
    const user = lsGet('ef_users').find(u => u.email === email);
    if (!user)               return { ok:false, message:'No account found with this email.' };
    if (user.password !== password) return { ok:false, message:'Incorrect password.' };
    if (!user.isActive)     return { ok:false, message:'Account deactivated.' };
    const { password: _, ...safe } = user;
    return { ok:true, token:'local_token_'+genId(), user: safe };
  },
  register(name, email, password, city) {
    const users = lsGet('ef_users');
    if (users.find(u => u.email === email)) return { ok:false, message:'Email already registered.' };
    const user = { _id: genId(), name, email, password, city, role:'user', isActive:true, createdAt: new Date().toISOString() };
    users.push(user);
    lsSet('ef_users', users);
    const { password: _, ...safe } = user;
    return { ok:true, token:'local_token_'+genId(), user: safe };
  },
};

// ── Toast notifications ───────────────────────────
function toast(msg, type = 'i') {
  const c = document.getElementById('toasts');
  if (!c) return;
  const icons = { s:'✅', e:'❌', i:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Toggle password visibility ────────────────────
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

// ── Sidebar toggle ────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ── Logout ────────────────────────────────────────
async function logout() {
  await api.post('/auth/logout');
  clearSession();
  location.href = 'login.html';
}

// ── Helpers ───────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function seatsLeft(ev)  { return Math.max(0, (ev.totalSeats||100) - (ev.bookedSeats||0)); }
function seatsPct(ev)   { return Math.round(((ev.bookedSeats||0)/(ev.totalSeats||100))*100); }
function seatClass(pct) { return pct >= 85 ? 'red' : pct >= 55 ? 'yellow' : 'green'; }
function catEmoji(cat)  { return {tech:'💻',design:'🎨',business:'💼',health:'🏃',science:'🔬',arts:'🎭'}[cat]||'🎯'; }
function catBg(cat)     { return {tech:'linear-gradient(135deg,#0d0d2a,#1a0a30)',design:'linear-gradient(135deg,#0a1a10,#0a2a18)',business:'linear-gradient(135deg,#1a0f00,#2a1a00)',health:'linear-gradient(135deg,#00101a,#001a2a)',science:'linear-gradient(135deg,#0a0a20,#101028)',arts:'linear-gradient(135deg,#1a0008,#2a000c)'}[cat]||'linear-gradient(135deg,#0d0d22,#1a0a30)'; }
function isUpcoming(d)  { return new Date(d) >= new Date(); }