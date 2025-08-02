// customerDashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const customerNameEl = document.getElementById('customer-name');
    const customerProfileForm = document.getElementById('profile-form');
    const profileMessageEl = document.getElementById('profile-message');
    const customerOrdersTableBody = document.getElementById('customer-orders-table-body');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const logoutBtn = document.getElementById('customer-logout-btn');
    const passwordForm = document.getElementById('password-form');
    const passwordMessageEl = document.getElementById('password-message');

    // Base URL for the backend API
    const API_BASE_URL = 'http://localhost:5000/api/customers';

    // Check for customer token on page load
    let token = localStorage.getItem('customerToken');
    if (!token) {
        window.location.href = 'customer-login.html';
        return;
    }

    // --- Core Functions ---

    /**
     * Fetches the logged-in customer's profile information and populates the form.
     */
    async function fetchCustomerProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Try to refresh token
                    const refreshToken = localStorage.getItem('customerRefreshToken');
                    if (refreshToken) {
                        console.log('Attempting to refresh token...');
                        try {
                            const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh-token', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken })
                            });
                            console.log('Refresh response status:', refreshResponse.status);
                            if (refreshResponse.ok) {
                                const refreshData = await refreshResponse.json();
                                console.log('New token received:', refreshData.token);
                                token = refreshData.token;
                                localStorage.setItem('customerToken', token);
                                // Retry fetching profile with new token
                                return fetchCustomerProfile();
                            } else {
                                throw new Error('Refresh token invalid');
                            }
                        } catch (err) {
                            console.error('Error refreshing token:', err);
                            alert('Session expired. Please log in again.');
                            localStorage.removeItem('customerToken');
                            localStorage.removeItem('customerRefreshToken');
                            window.location.href = 'customer-login.html';
                            return;
                        }
                    } else {
                        alert('Session expired. Please log in again.');
                        localStorage.removeItem('customerToken');
                        window.location.href = 'customer-login.html';
                        return;
                    }
                }
                throw new Error('Failed to fetch profile.');
            }

            const customer = await response.json();
            populateProfileForm(customer);

        } catch (error) {
            console.error('Error fetching customer profile:', error);
            // Handle error, maybe show a message on the page
        }
    }

    /**
     * Populates the profile form with customer data.
     * @param {Object} customer - The customer object from the API.
     */
    function populateProfileForm(customer) {
        customerNameEl.textContent = customer.firstName || 'Customer';
        document.getElementById('firstName').value = customer.firstName || '';
        document.getElementById('lastName').value = customer.lastName || '';
        document.getElementById('email').value = customer.email || '';
    }

    /**
     * Fetches the logged-in customer's orders from the backend.
     */
    async function fetchCustomerOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders.');
            }

            const orders = await response.json();
            renderCustomerOrders(orders);

        } catch (error) {
            console.error('Error fetching customer orders:', error);
            noOrdersMessage.textContent = 'Failed to load your orders.';
            noOrdersMessage.classList.remove('hidden');
        }
    }

    /**
     * Renders the customer's orders in a table.
     * @param {Array} orders - An array of order objects.
     */
    function renderCustomerOrders(orders) {
        customerOrdersTableBody.innerHTML = ''; // Clear existing rows

        if (orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
            return;
        }

        noOrdersMessage.classList.add('hidden'); // Hide the "no orders" message

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-100 transition-colors';
            
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order._id.substring(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${order.totalAmount.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'}">
                        ${order.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${orderDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="view-order-details-btn text-indigo-600 hover:text-indigo-900" data-order-id="${order._id}">View Details</button>
                </td>
            `;
            customerOrdersTableBody.appendChild(row);
        });
    }

    // --- Event Listeners and Initial Load ---

    // Handle profile form submission
    customerProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileMessageEl.classList.add('hidden');
        profileMessageEl.classList.remove('text-green-600', 'text-red-600');

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;

        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ firstName, lastName })
            });
            
            const data = await response.json();

            if (response.ok) {
                profileMessageEl.textContent = 'Profile updated successfully!';
                profileMessageEl.classList.add('text-green-600');
                profileMessageEl.classList.remove('hidden');
                // Refresh the name on the welcome message
                customerNameEl.textContent = data.firstName;
            } else {
                profileMessageEl.textContent = data.message || 'Failed to update profile.';
                profileMessageEl.classList.add('text-red-600');
                profileMessageEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            profileMessageEl.textContent = 'An error occurred. Please try again.';
            profileMessageEl.classList.add('text-red-600');
            profileMessageEl.classList.remove('hidden');
        }
    });

    // Handle password form submission
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        passwordMessageEl.classList.add('hidden');
        passwordMessageEl.classList.remove('text-green-600', 'text-red-600');

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            passwordMessageEl.textContent = 'New passwords do not match.';
            passwordMessageEl.classList.add('text-red-600');
            passwordMessageEl.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                passwordMessageEl.textContent = 'Password changed successfully!';
                passwordMessageEl.classList.add('text-green-600');
                passwordMessageEl.classList.remove('hidden');
                // Clear the password fields
                passwordForm.reset();
            } else {
                passwordMessageEl.textContent = data.message || 'Failed to change password.';
                passwordMessageEl.classList.add('text-red-600');
                passwordMessageEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            passwordMessageEl.textContent = 'An error occurred. Please try again.';
            passwordMessageEl.classList.add('text-red-600');
            passwordMessageEl.classList.remove('hidden');
        }
    });

    // Logout button handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('customerToken');
        window.location.href = 'customer-login.html';
    });

    // Initial data fetch
    fetchCustomerProfile();
    fetchCustomerOrders();
});