// ── nearby.js ──

let currentCity = 'all';
let userCity = '';

// Fake lat/lng for Indian cities (relative map positions)
const cityPositions = {
  'Delhi':     { x: 38, y: 22 },
  'Mumbai':    { x: 22, y: 52 },
  'Bengaluru': { x: 32, y: 70 },
  'Hyderabad': { x: 38, y: 60 },
  'Chennai':   { x: 40, y: 74 },
  'Pune':      { x: 26, y: 56 },
  'Kolkata':   { x: 66, y: 40 },
  'Ahmedabad': { x: 20, y: 42 },
};

const categoryColors = { tech: 'var(--accent)', design: 'var(--accent3)', business: 'var(--accent2)', health: '#ffc83c' };

function detectLocation() {
  const label = document.getElementById('locationLabel');
  label.textContent = 'Detecting location…';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        // Simulate city detection based on rough coords
        const { latitude } = pos.coords;
        if (latitude > 27) userCity = 'Delhi';
        else if (latitude > 22) userCity = 'Mumbai';
        else userCity = 'Bengaluru';
        label.textContent = `Showing events near ${userCity}`;
        document.getElementById('cityLabel').textContent = userCity;
        setCity(null, userCity);
      },
      () => {
        label.textContent = 'Location access denied — showing all events';
      }
    );
  } else {
    label.textContent = 'Location not supported — showing all events';
  }
}

function setCity(btn, city) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentCity = city;
  filterNearby();
  renderMapDots(city);
}

function renderMapDots(filterCity) {
  const container = document.getElementById('mapDots');
  if (!container) return;
  container.innerHTML = '';

  const events = getEvents();
  const cities = [...new Set(events.map(e => e.city).filter(Boolean))];

  cities.forEach(city => {
    const pos = cityPositions[city];
    if (!pos) return;
    const cityEvents = events.filter(e => e.city === city);
    const firstCat = cityEvents[0]?.category || 'tech';
    const isActive = filterCity === 'all' || filterCity === city;

    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;
      left:${pos.x}%;
      top:${pos.y}%;
      width:14px; height:14px;
      background:${categoryColors[firstCat] || 'var(--accent)'};
      border-radius:50%;
      border:3px solid rgba(255,255,255,0.2);
      cursor:pointer;
      transform:translate(-50%,-50%);
      transition:all 0.3s;
      opacity:${isActive ? 1 : 0.3};
      box-shadow:0 0 0 ${isActive ? '6px' : '0'} ${categoryColors[firstCat] || 'var(--accent)'}33;
    `;
    dot.title = `${city} — ${cityEvents.length} event(s)`;
    dot.onclick = () => {
      document.querySelectorAll('.filter-chip').forEach(c => {
        if (c.textContent === city) c.click();
      });
    };

    // Pulse for active
    if (isActive) {
      const pulse = document.createElement('div');
      pulse.className = 'map-dot-pulse';
      pulse.style.cssText = `position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);`;
      container.appendChild(pulse);
    }

    // City label
    const label = document.createElement('div');
    label.style.cssText = `
      position:absolute;
      left:${pos.x}%;
      top:calc(${pos.y}% + 16px);
      transform:translateX(-50%);
      font-size:0.68rem;
      color:${isActive ? 'var(--text)' : 'var(--muted)'};
      white-space:nowrap;
      font-family:'DM Sans',sans-serif;
      font-weight:500;
      pointer-events:none;
    `;
    label.textContent = city;
    container.appendChild(label);
    container.appendChild(dot);
  });
}

function filterNearby() {
  const events = getEvents().filter(e => {
    return currentCity === 'all' || e.city === currentCity;
  });

  const container = document.getElementById('nearbyContainer');
  const user = getCurrentUser();
  const myBookings = getBookings().filter(b => b.userId === user?._id && b.status !== 'cancelled');

  if (!events.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📍</div><h3>No events in this city</h3><p>Try a different city or expand the radius</p></div>`;
    return;
  }

  container.innerHTML = '';
  events.forEach(ev => {
    const alreadyBooked = myBookings.some(b => b.eventId === ev._id);
    const available = (ev.totalSeats || 100) - (ev.bookedSeats || 0);
    const actions = alreadyBooked
      ? `<span class="badge badge-green" style="padding:10px 16px">✓ Booked</span>`
      : `<button class="btn btn-primary btn-sm" onclick="bookEvent('${ev._id}')" ${available <= 0 ? 'disabled' : ''}>${available <= 0 ? 'Sold Out' : 'Book Now'}</button>`;
    container.insertAdjacentHTML('beforeend', buildEventCard(ev, actions));
  });

  document.getElementById('locationLabel').textContent =
    `Showing ${events.length} event${events.length !== 1 ? 's' : ''} ${currentCity !== 'all' ? `in ${currentCity}` : 'across all cities'}`;
}

// Init
renderMapDots('all');
filterNearby();
detectLocation();