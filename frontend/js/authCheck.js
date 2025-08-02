// frontend/js/authCheck.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    console.log('authCheck.js: Token on page load:', token);

    // --- NEW LOGS FOR DEBUGGING START ---
    console.log('authCheck.js loaded. Pathname:', window.location.pathname);
    console.log('Token found (initially):', !!token); // true if token exists, false otherwise

    // Impersonation Banner Logic (for customer-facing pages if applicable)
    const impersonationBanner = document.getElementById('impersonation-banner');
    const impersonatedCustomerNameSpan = document.getElementById('impersonated-customer-name');
    const exitImpersonationBtn = document.getElementById('exit-impersonation-btn');

    if (impersonationBanner && exitImpersonationBtn) {
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                if (decodedToken.isImpersonating) {
                    impersonatedCustomerNameSpan.textContent = decodedToken.impersonatedCustomerName || 'Unknown Customer';
                    impersonationBanner.style.display = 'block';

                    exitImpersonationBtn.onclick = () => {
                        const originalAdminToken = localStorage.getItem('admin_jwt_backup');
                        if (originalAdminToken) {
                            localStorage.setItem('token', originalAdminToken);
                        } else {
                            localStorage.removeItem('token');
                            alert('Admin token not found, please log in again.');
                            window.location.href = 'admin-login.html';
                            return;
                        }
                        localStorage.removeItem('admin_jwt_backup');
                        localStorage.removeItem('impersonated_customer_name');
                        alert('Exited impersonation. Returning to admin portal.');
                        window.location.href = 'adminDashboard.html'; // Adjust this path if needed
                    };
                } else {
                    impersonationBanner.style.display = 'none';
                }
            } catch (e) {
                console.error('Error decoding token for impersonation banner:', e);
                impersonationBanner.style.display = 'none';
            }
        } else {
            impersonationBanner.style.display = 'none';
        }
    }

    // Main JWT check for redirection (applies to all protected pages)
    if (!token) {
        console.log('authCheck.js: No token found. Redirecting...');
        if (window.location.pathname.includes('admin')) {
            console.log('authCheck.js: Path includes /admin. Redirecting to admin-login.html'); // New log
            window.location.href = 'admin-login.html'; // For admin pages
        } else if (window.location.pathname.includes('customer')) {
            console.log('authCheck.js: Path includes /customer. Redirecting to customer-login.html'); // New log
            window.location.href = 'customer-login.html'; // For customer pages
        } else {
            window.location.href = 'login-choice.html'; // Default if neither
        }
        return;
    }

    try {
        const decoded = JSON.parse(atob(token.split('.')[1])); // decode base64 payload
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            console.log('authCheck.js: Token expired. Redirecting...'); // New log
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('admin_jwt_backup');
            localStorage.removeItem('impersonated_customer_name');
            if (window.location.pathname.includes('admin')) {
                console.log('authCheck.js: Token expired, path includes /admin. Redirecting to admin-login.html'); // New log
                window.location.href = 'admin-login.html';
            } else if (window.location.pathname.includes('customer')) {
                console.log('authCheck.js: Token expired, path includes /customer. Redirecting to customer-login.html'); // New log
                window.location.href = 'customer-login.html';
            } else {
                console.log('authCheck.js: Token expired, path neither /admin nor /customer. Redirecting to login-choice.html'); // New log
                window.location.href = 'login-choice.html';
            }
            return;
        }

        // Redirect logic based on role if a user tries to access a page they shouldn't
        if (decoded.role === 'admin' && !window.location.pathname.includes('admin') && !decoded.isImpersonating) {
            // Admin user trying to access a non-admin page without impersonating
            // You might want to redirect them to the admin dashboard
            // window.location.href = 'adminDashboard.html';
        } else if (decoded.role === 'user' && window.location.pathname.includes('admin') && !decoded.isImpersonating) {
            // Regular user trying to access an admin page directly
            console.log('authCheck.js: User role detected on admin page. Access Denied.'); // New log
            alert('Access Denied. You do not have permission to view this page.');
            window.location.href = 'customerDashboard.html'; // Adjust this path if needed
        }

    } catch (e) {
        console.error('Error processing JWT for authentication check (catch block):', e); // Modified log
        alert('An authentication error occurred. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('admin_jwt_backup');
        localStorage.removeItem('impersonated_customer_name');
        if (window.location.pathname.includes('admin')) {
            console.log('authCheck.js: Error in JWT processing, path includes /admin. Redirecting to admin-login.html'); // New log
            window.location.href = 'admin-login.html';
        } else if (window.location.pathname.includes('customer')) {
            console.log('authCheck.js: Error in JWT processing, path includes /customer. Redirecting to customer-login.html'); // New log
            window.location.href = 'customer-login.html';
        } else {
            console.log('authCheck.js: Error in JWT processing, path neither /admin nor /customer. Redirecting to login-choice.html'); // New log
            window.location.href = 'login-choice.html';
        }
    }

    /* Logout button functionality (assuming an element with id="logoutBtn" exists on your pages) */
    const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const isAdminPage = window.location.pathname.includes('admin');
            localStorage.removeItem('token');
            localStorage.removeItem('admin_jwt_backup'); /* Clear backup token */
            localStorage.removeItem('impersonated_customer_name'); /* Clear impersonation name */
            alert('You have been logged out.');
            // Redirect to the appropriate login page
            window.location.href = isAdminPage ? 'admin-login.html' : 'login-choice.html';
        });
    }
});
