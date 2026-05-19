// ── events.js ──

let activeFilter = 'all';

function setFilter(btn, filter) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = filter;
  filterEvents();
}

function filterEvents() {
  const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const sort = document.getElementById('sortSelect')?.value || 'date';
  const user = getCurrentUser();
  const myBookings = getBookings().filter(b => b.userId === user?._id && b.status !== 'cancelled');

  let events = getEvents().filter(e => {
    const matchCat = activeFilter === 'all' || e.category === activeFilter;
    const matchSearch = !query ||
      e.title.toLowerCase().includes(query) ||
      e.speaker.toLowerCase().includes(query) ||
      (e.description || '').toLowerCase().includes(query) ||
      (e.city || '').toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  if (sort === 'date') events.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sort === 'seats') events.sort((a, b) => ((b.totalSeats - b.bookedSeats) - (a.totalSeats - a.bookedSeats)));
  else if (sort === 'title') events.sort((a, b) => a.title.localeCompare(b.title));

  const container = document.getElementById('eventsContainer');
  const countEl = document.getElementById('eventsCount');
  if (!container) return;

  if (countEl) countEl.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found`;

  if (!events.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>No events found</h3><p>Try a different search or filter</p></div>`;
    return;
  }

  container.innerHTML = '';
  events.forEach(ev => {
    const alreadyBooked = myBookings.some(b => b.eventId === ev._id);
    const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
    const actions = alreadyBooked
      ? `<span class="badge badge-green" style="padding:10px 16px">✓ Booked</span><button class="btn btn-secondary btn-sm" onclick="viewEventDetail('${ev._id}')">Details</button>`
      : `<button class="btn btn-primary btn-sm" onclick="bookEvent('${ev._id}')" ${available <= 0 ? 'disabled style="opacity:0.5"' : ''}>${available <= 0 ? 'Sold Out' : 'Book Now'}</button>
         <button class="btn btn-secondary btn-sm" onclick="viewEventDetail('${ev._id}')">Details</button>`;
    container.insertAdjacentHTML('beforeend', buildEventCard(ev, actions));
  });
}

function viewEventDetail(eventId) {
  const ev = getEvents().find(e => e._id === eventId);
  if (!ev) return;
  const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
  const pct = seatsPercent(ev.bookedSeats || 0, ev.totalSeats || 100);
  const user = getCurrentUser();
  const myBookings = getBookings().filter(b => b.userId === user?._id && b.status !== 'cancelled');
  const alreadyBooked = myBookings.some(b => b.eventId === ev._id);

  document.getElementById('modalTitle').textContent = ev.title;
  document.getElementById('modalBody').innerHTML = `
    <div style="background:${getCategoryColor(ev.category)};border-radius:var(--radius-sm);padding:20px;text-align:center;font-size:2.5rem;margin-bottom:16px">${getCategoryEmoji(ev.category)}</div>
    <p style="color:var(--muted);font-size:0.88rem;line-height:1.7;margin-bottom:16px">${ev.description || 'A must-attend virtual event.'}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Date</div>
        <div style="font-size:0.9rem;font-weight:600">📅 ${formatDate(ev.date)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Speaker</div>
        <div style="font-size:0.9rem;font-weight:600">🎤 ${ev.speaker}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Location</div>
        <div style="font-size:0.9rem;font-weight:600">📍 ${ev.city || 'Online'}</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px">
        <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Category</div>
        <div style="font-size:0.9rem;font-weight:600">${getCategoryEmoji(ev.category)} ${ev.category}</div>
      </div>
    </div>
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--muted);margin-bottom:6px">
        <span>Seats</span><span>${available} of ${ev.totalSeats} available</span>
      </div>
      <div class="seats-bar"><div class="seats-fill ${getSeatClass(pct)}" style="width:${pct}%"></div></div>
    </div>
  `;
  document.getElementById('modalActions').innerHTML = alreadyBooked
    ? `<span class="badge badge-green" style="padding:12px 20px;font-size:0.85rem">✓ Already Booked</span><a href="${ev.meetingLink}" target="_blank" class="btn btn-success">🔗 Join Event</a>`
    : `<button class="btn btn-primary" onclick="bookEvent('${ev._id}');closeModal()" style="flex:1;justify-content:center;border-radius:var(--radius-sm)" ${available <= 0 ? 'disabled' : ''}>${available <= 0 ? 'Sold Out' : 'Book This Event'}</button>`;
  openModal();
}

// Check if admin to show Add Event button
(function() {
  const user = getCurrentUser();
  const addBtn = document.getElementById('addEventBtn');
  if (user?.role === 'admin' && addBtn) addBtn.style.display = 'inline-flex';
  filterEvents();
})();