// sidebar.js — injects the sidebar HTML into #sidebarMount

function renderSidebar(activePage) {
  const mount = document.getElementById('sidebarMount');
  if (!mount) return;
  mount.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sb-logo">
        <div class="sb-logo-mark">E</div>
        <h2>Eventify</h2>
        <span>Virtual Events Platform</span>
      </div>

      <div class="sb-section">
        <div class="sb-label">Main</div>
        <a href="index.html"    class="sb-item ${activePage==='dashboard'?'active':''}"><span class="sb-icon">🏠</span>Dashboard</a>
        <a href="events.html"   class="sb-item ${activePage==='events'   ?'active':''}"><span class="sb-icon">🎯</span>Browse Events</a>
        <a href="nearby.html"   class="sb-item ${activePage==='nearby'   ?'active':''}"><span class="sb-icon">📍</span>Near Me</a>
      </div>

      <div class="sb-section">
        <div class="sb-label">My Space</div>
        <a href="bookings.html" class="sb-item ${activePage==='bookings' ?'active':''}">
          <span class="sb-icon">🎟️</span>My Bookings
          <span class="sb-badge" id="sbBookingBadge" style="display:none">0</span>
        </a>
      </div>

      <div class="sb-section" id="sbAdminSection" style="display:none">
        <div class="sb-label">Admin</div>
        <a href="admin.html" class="sb-item ${activePage==='admin' ?'active':''}"><span class="sb-icon">⚙️</span>Admin Panel</a>
      </div>

      <div class="sb-footer">
        <div class="sb-user">
          <div class="sb-avatar" id="sbAvatar">U</div>
          <div>
            <div class="sb-user-name" id="sbName">Loading…</div>
            <div class="sb-user-role" id="sbRole">Member</div>
          </div>
          <button class="sb-logout" onclick="logout()" title="Logout">⏏ Out</button>
        </div>
      </div>
    </aside>
  `;
}