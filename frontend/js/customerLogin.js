// This script handles the login form submission for customers.
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('http://localhost:5000/api/auth/customer-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Check if the user has either 'user' or 'customer' role.
            if (data.user.role === 'user' || data.user.role === 'customer') {
                // Save the token with the key 'customerToken'.
                localStorage.setItem('customerToken', data.token);
                // Save the refresh token with the key 'customerRefreshToken'.
                localStorage.setItem('customerRefreshToken', data.refreshToken);
                // Redirect to the customer dashboard.
                location.href = 'index.html';
            } else {
                alert("Not a customer account.");
            }
        } else {
            // Display an error message if login fails.
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Something went wrong. Please try again.');
    }
});
