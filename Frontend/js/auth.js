// ── auth.js ──

// Register
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  btn.innerHTML = '<span>Creating account…</span>';
  btn.disabled = true;

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const city = document.getElementById('reg-city').value.trim();

  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    btn.innerHTML = '<span>Create Account</span><span>→</span>';
    btn.disabled = false;
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('Email already registered. Sign in instead.', 'error');
    btn.innerHTML = '<span>Create Account</span><span>→</span>';
    btn.disabled = false;
    return;
  }

  const newUser = { _id: generateId(), name, email, password, city, role: 'user', createdAt: new Date().toISOString() };
  users.push(newUser);
  saveUsers(users);

  showToast('Account created successfully!', 'success');
  setTimeout(() => window.location.href = 'login.html', 1200);
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span>Signing in…</span>';
  btn.disabled = true;

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    showToast('No account found with this email', 'error');
    btn.innerHTML = '<span>Sign In</span><span>→</span>';
    btn.disabled = false;
    return;
  }

  if (user.password !== password) {
    showToast('Incorrect password', 'error');
    btn.innerHTML = '<span>Sign In</span><span>→</span>';
    btn.disabled = false;
    return;
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  showToast(`Welcome back, ${user.name.split(' ')[0]}! 🎉`, 'success');
  setTimeout(() => window.location.href = 'index.html', 1000);
});