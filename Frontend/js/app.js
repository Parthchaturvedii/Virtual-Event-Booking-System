// ── app.js — shared app logic ──

// ── Init sidebar ──
(function initSidebar() {
  const user = requireAuth();
  if (!user) return;

  const avatar = document.getElementById('sidebarAvatar');
  const nameEl = document.getElementById('sidebarName');
  const roleEl = document.getElementById('sidebarRole');
  const bookingBadge = document.getElementById('bookingCount');
  const adminSection = document.getElementById('adminNavSection');

  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) {
    roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Member';
    if (user.role === 'admin') roleEl.style.color = 'var(--accent2)';
  }
  if (adminSection && user.role === 'admin') adminSection.style.display = 'block';

  // Count user bookings
  if (bookingBadge) {
    const myBookings = getBookings().filter(b => b.userId === user._id && b.status !== 'cancelled');
    bookingBadge.textContent = myBookings.length;
    if (!myBookings.length) bookingBadge.style.display = 'none';
  }

  // Greeting (dashboard)
  const greeting = document.getElementById('greetingText');
  if (greeting) {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    greeting.textContent = `Good ${time}, ${user.name.split(' ')[0]} 👋`;
  }

  // Dashboard stats
  if (document.getElementById('statTotalEvents')) {
    document.getElementById('statTotalEvents').textContent = getEvents().length;
    const myB = getBookings().filter(b => b.userId === user._id && b.status !== 'cancelled');
    document.getElementById('statMyBookings').textContent = myB.length;
    renderUpcoming(user, myB);
    renderFeatured();
  }
})();

// ── Modal helpers ──
function openModal() { document.getElementById('eventModal')?.classList.add('open'); }
function closeModal() { document.getElementById('eventModal')?.classList.remove('open'); }

document.getElementById('eventModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── Event card builder ──
function buildEventCard(event, actions = '') {
  const booked = event.bookedSeats || 0;
  const total = event.totalSeats || 100;
  const pct = seatsPercent(booked, total);
  const seatClass = getSeatClass(pct);
  const available = total - booked;

  return `
    <div class="event-card" style="opacity:0;animation:slideUp 0.4s ease forwards">
      <div class="event-card-banner" style="background:${getCategoryColor(event.category)}">
        <div class="event-card-emoji">${getCategoryEmoji(event.category)}</div>
        <div style="position:absolute;top:12px;left:12px">
          <span class="badge badge-purple">${event.category || 'General'}</span>
        </div>
        ${available <= 5 && available > 0 ? '<div style="position:absolute;top:12px;right:12px"><span class="badge badge-red">🔥 Almost Full</span></div>' : ''}
        ${available === 0 ? '<div style="position:absolute;top:12px;right:12px"><span class="badge badge-red">Sold Out</span></div>' : ''}
      </div>
      <div class="event-card-body">
        <div class="event-card-header">
          <h3 class="event-card-title">${event.title}</h3>
        </div>
        <div class="event-card-meta">
          <div class="event-meta-item"><span>📅</span><span>${formatDate(event.date)}</span></div>
          <div class="event-meta-item"><span>🎤</span><span>${event.speaker}</span></div>
          <div class="event-meta-item"><span>📍</span><span>${event.city || 'Online'}</span></div>
        </div>
        <div class="seats-bar"><div class="seats-fill ${seatClass}" style="width:${pct}%"></div></div>
        <div class="seats-text">${available > 0 ? `${available} seats left of ${total}` : 'Fully booked'}</div>
        <div class="event-card-actions">${actions}</div>
      </div>
    </div>
  `;
}

// ── Dashboard: upcoming bookings ──
function renderUpcoming(user, myBookings) {
  const container = document.getElementById('upcomingContainer');
  if (!container) return;
  const events = getEvents();
  const upcoming = myBookings
    .filter(b => {
      const ev = events.find(e => e._id === b.eventId);
      return ev && isUpcoming(ev.date);
    })
    .slice(0, 3);

  if (!upcoming.length) return;

  container.innerHTML = '';
  upcoming.forEach(booking => {
    const ev = events.find(e => e._id === booking.eventId);
    if (!ev) return;
    const actions = `
      <a href="${ev.meetingLink}" target="_blank" class="btn btn-success btn-sm">🔗 Join</a>
      <button class="btn btn-danger btn-sm" onclick="quickCancel('${booking._id}','${ev.title.replace(/'/g,"\\'")}')">Cancel</button>
    `;
    container.insertAdjacentHTML('beforeend', buildEventCard(ev, actions));
  });
}

// ── Dashboard: featured events ──
function renderFeatured() {
  const container = document.getElementById('featuredContainer');
  if (!container) return;
  const events = getEvents().filter(e => isUpcoming(e.date)).slice(0, 6);
  const user = getCurrentUser();
  const myBookings = getBookings().filter(b => b.userId === user?._id && b.status !== 'cancelled');

  container.innerHTML = '';
  events.forEach(ev => {
    const alreadyBooked = myBookings.some(b => b.eventId === ev._id);
    const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
    const actions = alreadyBooked
      ? `<span class="badge badge-green" style="padding:10px 16px">✓ Booked</span>`
      : `<button class="btn btn-primary btn-sm" onclick="bookEvent('${ev._id}')" ${available <= 0 ? 'disabled' : ''}>${available <= 0 ? 'Sold Out' : 'Book Now'}</button>`;
    container.insertAdjacentHTML('beforeend', buildEventCard(ev, actions));
  });
}

// ── Book event ──
function bookEvent(eventId) {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const events = getEvents();
  const ev = events.find(e => e._id === eventId);
  if (!ev) return;

  const bookings = getBookings();
  if (bookings.find(b => b.userId === user._id && b.eventId === eventId && b.status !== 'cancelled')) {
    showToast('You already booked this event!', 'info'); return;
  }

  const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
  if (available <= 0) { showToast('This event is fully booked', 'error'); return; }

  const booking = { _id: generateId(), userId: user._id, eventId, bookingDate: new Date().toISOString(), status: 'confirmed' };
  bookings.push(booking);
  saveBookings(bookings);

  // Update seat count
  ev.bookedSeats = (ev.bookedSeats || 0) + 1;
  saveEvents(events);

  showToast(`🎉 Booked: ${ev.title}`, 'success');
  setTimeout(() => location.reload(), 800);
}

function quickCancel(bookingId, eventTitle) {
  if (!confirm(`Cancel booking for "${eventTitle}"?`)) return;
  cancelBookingById(bookingId);
}

function cancelBookingById(bookingId) {
  const bookings = getBookings();
  const b = bookings.find(b => b._id === bookingId);
  if (b) {
    const events = getEvents();
    const ev = events.find(e => e._id === b.eventId);
    if (ev && ev.bookedSeats > 0) { ev.bookedSeats--; saveEvents(events); }
    b.status = 'cancelled';
    saveBookings(bookings);
    showToast('Booking cancelled', 'info');
    setTimeout(() => location.reload(), 800);
  }
}

// ── Add event modal (for admin links on events page) ──
function openAddEventModal() {
  const user = getCurrentUser();
  if (user?.role !== 'admin') { showToast('Admin access required', 'error'); return; }
  document.getElementById('addEventModal')?.classList.add('open');
}

function submitAddEvent() {
  const title = document.getElementById('ae-title')?.value.trim();
  const desc = document.getElementById('ae-desc')?.value.trim();
  const date = document.getElementById('ae-date')?.value;
  const category = document.getElementById('ae-category')?.value;
  const speaker = document.getElementById('ae-speaker')?.value.trim();
  const seats = parseInt(document.getElementById('ae-seats')?.value) || 100;
  const link = document.getElementById('ae-link')?.value.trim();
  const city = document.getElementById('ae-city')?.value.trim();

  if (!title || !date || !speaker) { showToast('Please fill required fields', 'error'); return; }

  const events = getEvents();
  events.push({ _id: generateId(), title, description: desc, date, category, speaker, totalSeats: seats, bookedSeats: 0, meetingLink: link, city });
  saveEvents(events);

  document.getElementById('addEventModal')?.classList.remove('open');
  showToast('Event created!', 'success');
  setTimeout(() => location.reload(), 700);
}