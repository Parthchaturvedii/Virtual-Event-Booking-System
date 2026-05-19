// layout.js — shared sidebar init, event card builder
// Must be loaded after utils.js on every app page

function initLayout() {
  const user = requireAuth();
  if (!user) return null;

  // Avatar + name
  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setEl('sbName', user.name);
  setEl('sbRole', user.role === 'admin' ? 'Administrator' : 'Member');
  const av = document.getElementById('sbAvatar');
  if (av) av.textContent = user.name.charAt(0).toUpperCase();

  // Admin nav
  const adm = document.getElementById('sbAdminSection');
  if (adm) adm.style.display = user.role === 'admin' ? 'block' : 'none';

  // Booking badge
  const badge = document.getElementById('sbBookingBadge');
  if (badge) {
    const myB = localDB.getBookings(user._id).filter(b => b.status !== 'cancelled');
    if (myB.length) { badge.textContent = myB.length; badge.style.display = 'inline'; }
    else badge.style.display = 'none';
  }

  return user;
}

// ── Event card HTML builder ──────────────────────
function buildCard(ev, actions = '', delay = 0) {
  const left = seatsLeft(ev);
  const pct  = seatsPct(ev);
  const sc   = seatClass(pct);
  const full = left === 0;
  const hot  = left > 0 && left <= 5;

  return `
    <div class="card fade-up" style="animation-delay:${delay}s">
      <div class="event-card-banner" style="background:${catBg(ev.category)}">
        ${catEmoji(ev.category)}
        <div style="position:absolute;top:10px;left:10px;z-index:1">
          <span class="badge badge-violet">${ev.category}</span>
        </div>
        ${hot  ? '<div style="position:absolute;top:10px;right:10px;z-index:1"><span class="badge badge-gold">🔥 Almost Full</span></div>' : ''}
        ${full ? '<div style="position:absolute;top:10px;right:10px;z-index:1"><span class="badge badge-rose">Sold Out</span></div>' : ''}
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${ev.title}</h3>
        <div class="event-card-meta">
          <div class="meta-row"><span class="meta-icon">📅</span>${fmtDate(ev.date)}</div>
          <div class="meta-row"><span class="meta-icon">🎤</span>${ev.speaker}</div>
          <div class="meta-row"><span class="meta-icon">📍</span>${ev.city||'Online'}</div>
        </div>
        <div class="seat-bar-wrap">
          <div class="seat-bar"><div class="seat-fill ${sc}" style="width:${pct}%"></div></div>
          <div class="seat-text">${full ? 'Fully booked' : `${left} of ${ev.totalSeats||100} seats left`}</div>
        </div>
        <div class="event-card-actions">${actions}</div>
      </div>
    </div>`;
}

// ── Book event ────────────────────────────────────
async function bookEvent(eventId) {
  const user = requireAuth();
  if (!user) return;

  const evs  = lsGet('ef_events');
  const ev   = evs.find(e => e._id === eventId);
  if (!ev) { toast('Event not found','e'); return; }

  const bs = lsGet('ef_bookings');
  if (bs.find(b => b.userId === user._id && b.eventId === eventId && b.status !== 'cancelled')) {
    toast('You already booked this event!','i'); return;
  }
  if (seatsLeft(ev) <= 0) { toast('Event is fully booked','e'); return; }

  // Try real API first
  const res = await api.post('/bookings', { eventId });
  if (res.ok) {
    toast(`🎉 Booked: ${ev.title}`, 's');
  } else {
    // Fallback: local
    const booking = { _id: genId(), userId: user._id, eventId, status:'confirmed', bookingDate: new Date().toISOString() };
    localDB.saveBooking(booking);
    ev.bookedSeats = (ev.bookedSeats||0)+1;
    localDB.saveEvent(ev);
    toast(`🎉 Booked: ${ev.title}`, 's');
  }
  setTimeout(() => location.reload(), 700);
}

// ── Cancel booking ────────────────────────────────
async function cancelBooking(bookingId) {
  const res = await api.patch(`/bookings/${bookingId}/cancel`);
  if (res.ok) {
    toast('Booking cancelled','i');
  } else {
    localDB.cancelBooking(bookingId);
    toast('Booking cancelled','i');
  }
  setTimeout(() => location.reload(), 700);
}