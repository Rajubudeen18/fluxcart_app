document.addEventListener('DOMContentLoaded', () => {
    const customerTableBody = document.getElementById('customerTableBody');
    const searchInput = document.getElementById('customerSearch');
    const statusFilter = document.getElementById('customerStatusFilter');
    const customerEditForm = document.getElementById('customerEditForm');
    const customerEditModal = document.getElementById('customerEditModal');
    const modalCloseButton = document.querySelector('#customerEditModal .close-btn');

    // --- Event Listeners ---
    if (searchInput) {
        searchInput.addEventListener('input', () => fetchCustomers(searchInput.value, statusFilter.value));
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => fetchCustomers(searchInput.value, statusFilter.value));
    }

    if (customerEditForm) {
        customerEditForm.addEventListener('submit', submitCustomerForm);
    }

    // Event listener for closing the modal
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeEditModal);
    }

    // Event Delegation for Table Buttons
    if (customerTableBody) {
        customerTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button');
            if (!target) return; // Ignore clicks that are not on a button

            const customerId = target.dataset.id;
            const customerName = target.dataset.name;

            if (target.classList.contains('view-edit-btn')) {
                openEditModal(customerId);
            } else if (target.classList.contains('toggle-status-btn')) {
                const currentStatus = target.dataset.status;
                const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
                if (confirm(`Are you sure you want to set status to "${newStatus}" for this customer?`)) {
                    await toggleCustomerStatus(customerId, newStatus);
                }
            } else if (target.classList.contains('reset-password-btn')) {
                const newPassword = prompt('Enter new password for this customer (min 6 characters):');
                if (newPassword && newPassword.length >= 6) {
                    await resetCustomerPassword(customerId, newPassword);
                } else if (newPassword !== null) {
                    alert('Password must be at least 6 characters.');
                }
            } else if (target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                    await deleteCustomer(customerId);
                }
            } else if (target.classList.contains('impersonate-btn')) {
                if (confirm(`Are you sure you want to impersonate ${customerName}? You will be logged in as them.`)) {
                    await impersonateCustomer(customerId, customerName);
                }
            }
        });
    }

    // Initial fetch of customers
    fetchCustomers();

    // --- Helper for API calls ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('apiCall: No JWT token found. authCheck.js should handle redirection.');
            return { ok: false, data: { message: 'Not authenticated' } };
        }

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            return { ok: response.ok, data };
        } catch (error) {
            console.error(`apiCall Error: ${method} ${endpoint}`, error);
            return { ok: false, data: { message: 'Network error or invalid JSON response.' } };
        }
    }

    // --- Core Functions ---
    async function fetchCustomers(searchQuery = '', status = '') {
        const { ok, data } = await apiCall(`/api/customers?search=${searchQuery}&status=${status}`);

        if (ok) {
            renderCustomers(data);
        } else {
            alert(`Error fetching customers: ${data.message || 'Unknown error'}`);
            customerTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading customers.</td></tr>';
        }
    }

    // Function to render customers into the table
    function renderCustomers(customers) {
        customerTableBody.innerHTML = ''; // Clear existing rows

        if (!customers || customers.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found.</td></tr>';
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.firstName} ${customer.lastName}</td>
                <td>${customer.email}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td><span class="badge ${customer.status === 'active' ? 'bg-success' : 'bg-danger'}">${customer.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info view-edit-btn" data-id="${customer._id}">View/Edit</button>
                    <button class="btn btn-sm btn-${customer.status === 'active' ? 'warning' : 'success'} toggle-status-btn" data-id="${customer._id}" data-status="${customer.status}">${customer.status === 'active' ? 'Block' : 'Unblock'}</button>
                    <button class="btn btn-sm btn-secondary reset-password-btn" data-id="${customer._id}">Reset Password</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${customer._id}">Delete</button>
                    <button class="btn btn-sm btn-outline-primary impersonate-btn" data-id="${customer._id}" data-name="${customer.firstName} ${customer.lastName}">Impersonate</button>
                </td>
            `;
            customerTableBody.appendChild(row);
        });
    }

    // --- Modal Functions ---
    async function openEditModal(customerId) {
        const { ok, data: customer } = await apiCall(`/api/customers/${customerId}`);
        if (!ok) {
            alert(`Error fetching customer details: ${customer.message}`);
            return;
        }

        // Populate the form
        document.getElementById('customerId').value = customer._id;
        document.getElementById('firstName').value = customer.firstName;
        document.getElementById('lastName').value = customer.lastName;
        document.getElementById('email').value = customer.email;
        document.getElementById('phone').value = customer.phone || '';
        document.getElementById('address').value = customer.address || '';

        // Show the modal
        if (customerEditModal) customerEditModal.style.display = 'block';
    }

    function closeEditModal() {
        if (customerEditModal) customerEditModal.style.display = 'none';
    }

    async function submitCustomerForm(event) {
        event.preventDefault();
        const form = event.target;
        const customerId = form.customerId.value;

        const customerData = {
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            email: form.email.value,
            phone: form.phone.value,
            address: form.address.value,
        };

        const { ok, data } = await apiCall(`/api/customers/${customerId}`, 'PATCH', customerData);

        if (ok) {
            alert('Customer updated successfully!');
            closeEditModal();
            fetchCustomers(searchInput.value, statusFilter.value); // Refresh the list
        } else {
            alert(`Failed to update customer: ${data.message}`);
        }
    }

    // --- Action Functions ---
    async function toggleCustomerStatus(id, newStatus) {
        const { ok, data } = await apiCall(`/api/customers/${id}`, 'PATCH', { status: newStatus });
        if (ok) {
            alert(`Customer status updated to "${newStatus}" successfully.`);
            fetchCustomers(searchInput.value, statusFilter.value);
        } else {
            alert(`Failed to update status: ${data.message || 'Unknown error'}`);
        }
    }

    async function resetCustomerPassword(id, newPassword) {
        const { ok, data } = await apiCall(`/api/customers/${id}/reset-password`, 'PATCH', { newPassword });
        if (ok) {
            alert('Customer password reset successfully.');
        } else {
            alert(`Failed to reset password: ${data.message || 'Unknown error'}`);
        }
    }

    async function deleteCustomer(id) {
        const { ok, data } = await apiCall(`/api/customers/${id}`, 'DELETE');
        if (ok) {
            alert('Customer deleted successfully.');
            fetchCustomers(searchInput.value, statusFilter.value);
        } else {
            alert(`Failed to delete customer: ${data.message || 'Unknown error'}`);
        }
    }

    async function impersonateCustomer(id, name) {
        const originalToken = localStorage.getItem('token');
        const { ok, data } = await apiCall(`/api/customers/impersonate/${id}`, 'POST');

        if (ok) {
            // Store the original admin token
            localStorage.setItem('admin_jwt_backup', originalToken);
            // Set the new impersonation token
            localStorage.setItem('token', data.token);
            // Store impersonated customer name for banner
            localStorage.setItem('impersonated_customer_name', name);
            alert(`Successfully impersonated ${name}. Redirecting to customer dashboard.`);
            window.location.href = 'index.html'; // Redirect to customer's view
        } else {
            alert(`Failed to impersonate: ${data.message || 'Unknown error'}`);
        }
    }
});
