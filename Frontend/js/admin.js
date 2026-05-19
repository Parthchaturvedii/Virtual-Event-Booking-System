// ── admin.js ──

let deleteTargetId = null;
let editingEventId = null;

// Guard: admin only
(function() {
  const user = getCurrentUser();
  if (user?.role !== 'admin') {
    showToast('Admin access required', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
  }
})();

function adminTab(btn, tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['events','users','bookings','seats'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
}

function loadAdminStats() {
  const events = getEvents();
  const users = getUsers();
  const bookings = getBookings();
  const totalSeats = events.reduce((sum, e) => sum + (e.totalSeats || 100), 0);
  const bookedSeats = events.reduce((sum, e) => sum + (e.bookedSeats || 0), 0);

  document.getElementById('adminTotalEvents').textContent = events.length;
  document.getElementById('adminTotalUsers').textContent = users.length;
  document.getElementById('adminTotalBookings').textContent = bookings.filter(b => b.status !== 'cancelled').length;
  document.getElementById('adminSeatsAvail').textContent = totalSeats - bookedSeats;
}

function renderAdminEvents() {
  const query = document.getElementById('adminSearchEvents')?.value.toLowerCase() || '';
  const catFilter = document.getElementById('adminCatFilter')?.value || 'all';
  let events = getEvents().filter(e => {
    const matchCat = catFilter === 'all' || e.category === catFilter;
    const matchQ = !query || e.title.toLowerCase().includes(query) || e.speaker.toLowerCase().includes(query) || (e.city||'').toLowerCase().includes(query);
    return matchCat && matchQ;
  });

  const tbody = document.getElementById('adminEventsTable');
  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🎯</div><h3>No events found</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(ev => {
    const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
    const pct = seatsPercent(ev.bookedSeats || 0, ev.totalSeats || 100);
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;background:${getCategoryColor(ev.category)};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">${getCategoryEmoji(ev.category)}</div>
            <div>
              <div style="font-weight:600;font-size:0.88rem">${ev.title}</div>
              <div style="font-size:0.73rem;color:var(--muted)">${(ev.description||'').slice(0,50)}${ev.description?.length > 50 ? '…' : ''}</div>
            </div>
          </div>
        </td>
        <td style="font-size:0.85rem">${formatDate(ev.date)}</td>
        <td style="font-size:0.85rem;color:var(--muted)">${ev.speaker}</td>
        <td style="font-size:0.85rem;color:var(--muted)">${ev.city || 'Online'}</td>
        <td>
          <div style="min-width:100px">
            <div class="seats-bar"><div class="seats-fill ${getSeatClass(pct)}" style="width:${pct}%"></div></div>
            <div style="font-size:0.73rem;color:var(--muted);margin-top:3px">${available}/${ev.totalSeats||100}</div>
          </div>
        </td>
        <td><span class="badge badge-purple">${ev.category}</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="editEvent('${ev._id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${ev._id}','${ev.title.replace(/'/g,"\\'")}')">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminUsers() {
  const users = getUsers();
  const bookings = getBookings();
  const tbody = document.getElementById('adminUsersTable');

  tbody.innerHTML = users.map(u => {
    const userBookings = bookings.filter(b => b.userId === u._id && b.status !== 'cancelled');
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.82rem;color:white">${u.name.charAt(0)}</div>
            <span style="font-size:0.88rem;font-weight:600">${u.name}</span>
          </div>
        </td>
        <td style="font-size:0.85rem;color:var(--muted)">${u.email}</td>
        <td style="font-size:0.85rem;color:var(--muted)">${u.city || '—'}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-red' : 'badge-purple'}">${u.role}</span></td>
        <td style="font-size:0.85rem">${userBookings.length}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleUserRole('${u._id}')">
            ${u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminBookings() {
  const bookings = getBookings();
  const events = getEvents();
  const users = getUsers();
  const tbody = document.getElementById('adminBookingsTable');

  tbody.innerHTML = bookings.map(b => {
    const ev = events.find(e => e._id === b.eventId);
    const user = users.find(u => u._id === b.userId);
    if (!ev || !user) return '';
    const statusBadge = b.status === 'cancelled'
      ? '<span class="badge badge-red">Cancelled</span>'
      : isUpcoming(ev.date)
        ? '<span class="badge badge-green">Confirmed</span>'
        : '<span class="badge badge-yellow">Completed</span>';
    return `
      <tr>
        <td>
          <div style="font-size:0.88rem;font-weight:600">${user.name}</div>
          <div style="font-size:0.75rem;color:var(--muted)">${user.email}</div>
        </td>
        <td style="font-size:0.88rem">${ev.title}</td>
        <td style="font-size:0.82rem;color:var(--muted)">${formatDate(b.bookingDate)}</td>
        <td>${statusBadge}</td>
        <td>
          ${b.status !== 'cancelled' ? `<button class="btn btn-danger btn-sm" onclick="adminCancelBooking('${b._id}')">Cancel</button>` : '—'}
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🎟️</div><h3>No bookings yet</h3></div></td></tr>`;
}

function renderSeatManager() {
  const events = getEvents();
  const container = document.getElementById('seatManagerContainer');
  container.innerHTML = events.map(ev => {
    const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
    const pct = seatsPercent(ev.bookedSeats || 0, ev.totalSeats || 100);
    return `
      <div class="glass" style="padding:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;background:${getCategoryColor(ev.category)};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">${getCategoryEmoji(ev.category)}</div>
          <div>
            <div style="font-weight:700;font-size:0.9rem">${ev.title}</div>
            <div style="font-size:0.75rem;color:var(--muted)">${formatDate(ev.date)}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:8px">
          <span style="color:var(--muted)">Capacity</span>
          <span><strong>${ev.bookedSeats||0}</strong>/${ev.totalSeats||100} booked</span>
        </div>
        <div class="seats-bar" style="height:10px;margin-bottom:10px"><div class="seats-fill ${getSeatClass(pct)}" style="width:${pct}%;height:100%"></div></div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-secondary btn-sm" onclick="adjustSeats('${ev._id}',-10)" ${(ev.totalSeats||100) <= 10 ? 'disabled' : ''}>−10 Seats</button>
          <button class="btn btn-secondary btn-sm" onclick="adjustSeats('${ev._id}',10)">+10 Seats</button>
          <span style="margin-left:auto;font-size:0.8rem;color:${available > 0 ? 'var(--accent3)' : 'var(--accent2)'};display:flex;align-items:center">${available > 0 ? `${available} available` : 'Full'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function adjustSeats(eventId, delta) {
  const events = getEvents();
  const ev = events.find(e => e._id === eventId);
  if (!ev) return;
  const newTotal = Math.max((ev.totalSeats || 100) + delta, ev.bookedSeats || 0);
  ev.totalSeats = newTotal;
  saveEvents(events);
  loadAdminStats();
  renderSeatManager();
  showToast(`Capacity updated to ${newTotal}`, 'success');
}

function editEvent(eventId) {
  const ev = getEvents().find(e => e._id === eventId);
  if (!ev) return;
  editingEventId = eventId;
  document.getElementById('addEventModalTitle').textContent = 'Edit Event';
  document.getElementById('ae-id').value = ev._id;
  document.getElementById('ae-title').value = ev.title;
  document.getElementById('ae-desc').value = ev.description || '';
  document.getElementById('ae-date').value = ev.date;
  document.getElementById('ae-category').value = ev.category || 'tech';
  document.getElementById('ae-speaker').value = ev.speaker;
  document.getElementById('ae-seats').value = ev.totalSeats || 100;
  document.getElementById('ae-link').value = ev.meetingLink || '';
  document.getElementById('ae-city').value = ev.city || '';
  document.getElementById('ae-submit-btn').textContent = 'Update Event';
  document.getElementById('addEventModal').classList.add('open');
}

function submitEventForm() {
  const title = document.getElementById('ae-title').value.trim();
  const desc = document.getElementById('ae-desc').value.trim();
  const date = document.getElementById('ae-date').value;
  const category = document.getElementById('ae-category').value;
  const speaker = document.getElementById('ae-speaker').value.trim();
  const seats = parseInt(document.getElementById('ae-seats').value) || 100;
  const link = document.getElementById('ae-link').value.trim();
  const city = document.getElementById('ae-city').value.trim();

  if (!title || !date || !speaker) { showToast('Fill all required fields', 'error'); return; }

  const events = getEvents();
  if (editingEventId) {
    const idx = events.findIndex(e => e._id === editingEventId);
    if (idx >= 0) {
      events[idx] = { ...events[idx], title, description: desc, date, category, speaker, totalSeats: seats, meetingLink: link, city };
      saveEvents(events);
      showToast('Event updated!', 'success');
    }
  } else {
    events.push({ _id: generateId(), title, description: desc, date, category, speaker, totalSeats: seats, bookedSeats: 0, meetingLink: link, city });
    saveEvents(events);
    showToast('Event created!', 'success');
  }
  editingEventId = null;
  document.getElementById('addEventModal').classList.remove('open');
  loadAdminStats();
  renderAdminEvents();
  renderSeatManager();
}

function openAddEventModal() {
  editingEventId = null;
  document.getElementById('addEventModalTitle').textContent = 'Create New Event';
  ['ae-title','ae-desc','ae-date','ae-speaker','ae-link','ae-city'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('ae-seats').value = '100';
  document.getElementById('ae-category').value = 'tech';
  document.getElementById('ae-submit-btn').textContent = 'Create Event';
  document.getElementById('addEventModal').classList.add('open');
}

function openDeleteModal(eventId, eventTitle) {
  deleteTargetId = eventId;
  document.getElementById('deleteEventName').textContent = eventTitle;
  document.getElementById('deleteModal').classList.add('open');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  const events = getEvents().filter(e => e._id !== deleteTargetId);
  saveEvents(events);
  // Remove all bookings for this event
  const bookings = getBookings().filter(b => b.eventId !== deleteTargetId);
  saveBookings(bookings);
  deleteTargetId = null;
  document.getElementById('deleteModal').classList.remove('open');
  showToast('Event deleted', 'info');
  loadAdminStats();
  renderAdminEvents();
}

function adminCancelBooking(bookingId) {
  cancelBookingById(bookingId);
  setTimeout(() => { loadAdminStats(); renderAdminBookings(); }, 300);
}

function toggleUserRole(userId) {
  const users = getUsers();
  const u = users.find(u => u._id === userId);
  if (!u) return;
  const current = getCurrentUser();
  if (u._id === current._id) { showToast("Can't change your own role", 'error'); return; }
  u.role = u.role === 'admin' ? 'user' : 'admin';
  saveUsers(users);
  showToast(`${u.name} is now ${u.role}`, 'success');
  renderAdminUsers();
}

// Init
loadAdminStats();
renderAdminEvents();
renderAdminUsers();
renderAdminBookings();
renderSeatManager();