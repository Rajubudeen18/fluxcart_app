document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = form.elements["firstName"].value;
    const lastName = form.elements["lastName"].value;
    const email = form.elements["email"].value;
    const password = form.elements["password"].value;

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Registration successful!');
        window.location.href = 'customer-login.html';
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  });
});
