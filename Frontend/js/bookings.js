// ── bookings.js ──

let cancelTargetId = null;
let activeTab = 'upcoming';

function switchTab(btn, tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeTab = tab;
  renderBookings();
}

function renderBookings() {
  const user = getCurrentUser();
  const events = getEvents();
  const allBookings = getBookings().filter(b => b.userId === user._id);

  const tbody = document.getElementById('bookingsTableBody');
  const cardsContainer = document.getElementById('bookingCardsContainer');

  let filtered = allBookings;
  if (activeTab === 'upcoming') filtered = allBookings.filter(b => b.status !== 'cancelled' && isUpcoming(events.find(e => e._id === b.eventId)?.date || ''));
  else if (activeTab === 'past') filtered = allBookings.filter(b => b.status !== 'cancelled' && !isUpcoming(events.find(e => e._id === b.eventId)?.date || ''));
  else if (activeTab === 'cancelled') filtered = allBookings.filter(b => b.status === 'cancelled');

  // Table
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🎟️</div><h3>No ${activeTab} bookings</h3><p>${activeTab === 'upcoming' ? 'Browse events to book your next one!' : 'Nothing here yet.'}</p></div></td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(b => {
      const ev = events.find(e => e._id === b.eventId);
      if (!ev) return '';
      const upcoming = isUpcoming(ev.date);
      const statusBadge = b.status === 'cancelled'
        ? '<span class="badge badge-red">Cancelled</span>'
        : upcoming
          ? '<span class="badge badge-green">Confirmed</span>'
          : '<span class="badge badge-yellow">Completed</span>';

      const actions = b.status !== 'cancelled' && upcoming
        ? `<div style="display:flex;gap:6px">
            <a href="${ev.meetingLink}" target="_blank" class="btn btn-success btn-sm">🔗 Join</a>
            <button class="btn btn-danger btn-sm" onclick="openCancelModal('${b._id}','${ev.title.replace(/'/g,"\\'")}')">Cancel</button>
           </div>`
        : b.status === 'cancelled'
          ? `<button class="btn btn-secondary btn-sm" onclick="rebookEvent('${ev._id}')">Rebook</button>`
          : '<span style="color:var(--muted);font-size:0.82rem">Event ended</span>';

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:${getCategoryColor(ev.category)};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${getCategoryEmoji(ev.category)}</div>
              <div>
                <div style="font-weight:600;font-size:0.9rem">${ev.title}</div>
                <div style="font-size:0.75rem;color:var(--muted)">${ev.city || 'Online'}</div>
              </div>
            </div>
          </td>
          <td style="font-size:0.88rem">${formatDate(ev.date)}</td>
          <td style="font-size:0.88rem;color:var(--muted)">${ev.speaker}</td>
          <td><span class="badge badge-purple">${ev.category}</span></td>
          <td>${statusBadge}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');
  }

  // Cards (upcoming only)
  if (cardsContainer) {
    const upcomingBookings = allBookings.filter(b => b.status !== 'cancelled' && isUpcoming(events.find(e => e._id === b.eventId)?.date || ''));
    if (!upcomingBookings.length) {
      cardsContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📅</div><h3>No upcoming events</h3><p>Book some events to see them here!</p></div>`;
    } else {
      cardsContainer.innerHTML = '';
      upcomingBookings.forEach(b => {
        const ev = events.find(e => e._id === b.eventId);
        if (!ev) return;
        const actions = `
          <a href="${ev.meetingLink}" target="_blank" class="btn btn-success btn-sm">🔗 Join</a>
          <button class="btn btn-danger btn-sm" onclick="openCancelModal('${b._id}','${ev.title.replace(/'/g,"\\'")}')">Cancel</button>
        `;
        cardsContainer.insertAdjacentHTML('beforeend', buildEventCard(ev, actions));
      });
    }
  }
}

function openCancelModal(bookingId, eventTitle) {
  cancelTargetId = bookingId;
  document.getElementById('cancelEventName').textContent = eventTitle;
  document.getElementById('cancelModal').classList.add('open');
}

function confirmCancel() {
  if (!cancelTargetId) return;
  cancelBookingById(cancelTargetId);
  document.getElementById('cancelModal').classList.remove('open');
  cancelTargetId = null;
}

function rebookEvent(eventId) {
  bookEvent(eventId);
}

// Init
renderBookings();