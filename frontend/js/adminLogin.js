document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://127.0.0.1:5000/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    if (data.user.role === 'admin') {
      localStorage.setItem('token', data.token);
      location.href = 'adminDashboard.html';
    } else {
      alert("Not a admin account.");
    }
  } else {
    alert(data.message);
  }
});
