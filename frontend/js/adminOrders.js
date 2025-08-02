// adminOrders.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ordersTableBody = document.getElementById('orders-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    const statusFilter = document.getElementById('status-filter');
    const customerSearch = document.getElementById('customer-search');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const filterBtn = document.getElementById('filter-btn');
    const createOrderBtn = document.getElementById('create-order-btn');
    const orderDetailsModal = document.getElementById('order-details-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveOrderBtn = document.getElementById('save-order-btn');

    let currentPage = 1;
    let currentFilters = {};

    // Base URL for API requests
    const BASE_URL = 'http://localhost:5000/api/admin';

    // --- Core Functions ---

    // Function to fetch orders from the API
    async function fetchOrders(page = 1, filters = {}) {
        try {
            // The authCheck.js script, included before this, handles all token validation and redirection.
            const token = localStorage.getItem('token');

            // Construct the query string from filters
            const params = new URLSearchParams({ pageNumber: page });
            if (filters.status) params.append('status', filters.status);
            if (filters.customer) params.append('customer', filters.customer);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            const response = await fetch(`${BASE_URL}/orders?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders.');
            }

            const data = await response.json();
            renderOrders(data.orders);
            renderPagination(data.pages, data.page);

        } catch (error) {
            console.error('Error fetching orders:', error);
            // This is the generic alert you're seeing. It happens if the fetch fails for any reason.
            // If the database is empty, the response will be successful (200 OK) but with an empty array.
            // So we'll update the alert to be more specific.
            ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">An error occurred or no orders were found. Please try creating a test order.</td></tr>`;
        }
    }

    // Function to render the orders table
    function renderOrders(orders) {
        ordersTableBody.innerHTML = ''; // Clear existing rows

        if (orders.length === 0) {
            ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No orders found. Please create a test order to see data.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-100 transition-colors';
            
            // Format order date
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            
            // Format customer name
            const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A';
            
            // Format customer phone and address from shippingAddress
            const customerPhone = order.shippingAddress && order.shippingAddress.phone ? order.shippingAddress.phone : 'N/A';
            const customerAddress = order.shippingAddress ? 
                `${order.shippingAddress.addressLine1 || ''}${order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}` : 
                'N/A';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order._id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customerName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customerPhone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customerAddress}</td>
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${order.totalAmount.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${orderDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="view-order-btn text-indigo-600 hover:text-indigo-900 mr-2" data-order-id="${order._id}">View/Edit</button>
                    <button class="delete-order-btn text-red-600 hover:text-red-900" data-order-id="${order._id}">Delete</button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    }

    // Function to render pagination controls
    function renderPagination(totalPages, currentPage) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.className = `px-3 py-1 rounded-md text-sm ${
                isDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
            }`;
            btn.disabled = isDisabled;
            btn.addEventListener('click', () => {
                currentPage = page;
                fetchOrders(currentPage, currentFilters);
            });
            return btn;
        };

        paginationControls.appendChild(createButton('<<', 1, currentPage === 1));
        paginationControls.appendChild(createButton('<', currentPage - 1, currentPage === 1));

        // Show a few pages around the current one
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `px-3 py-1 rounded-md text-sm ${
                i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                fetchOrders(currentPage, currentFilters);
            });
            paginationControls.appendChild(pageBtn);
        }

        paginationControls.appendChild(createButton('>', currentPage + 1, currentPage === totalPages));
        paginationControls.appendChild(createButton('>>', totalPages, currentPage === totalPages));
    }


    // --- Event Listeners and Initial Load ---

    // Initial load of orders
    fetchOrders(currentPage);

    // Filter button click handler
    filterBtn.addEventListener('click', () => {
        currentFilters = {
            status: statusFilter.value,
            customer: customerSearch.value,
            dateFrom: dateFrom.value,
            dateTo: dateTo.value
        };
        currentPage = 1; // Reset to first page on new filter
        fetchOrders(currentPage, currentFilters);
    });

    // Handle View/Edit and Delete buttons
    ordersTableBody.addEventListener('click', async (e) => {
        const orderId = e.target.dataset.orderId;
        if (!orderId) return;

        if (e.target.classList.contains('view-order-btn')) {
            openOrderDetailsModal(orderId);
        } else if (e.target.classList.contains('delete-order-btn')) {
            if (confirm('Are you sure you want to delete this order?')) {
                await deleteOrder(orderId);
            }
        }
    });
    
    // Handler for creating a test order
    createOrderBtn.addEventListener('click', async () => {
        await createTestOrder();
    });

    // Function to delete an order
    async function deleteOrder(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete order.');
            }

            alert('Order deleted successfully!');
            fetchOrders(currentPage, currentFilters); // Refresh list

        } catch (error) {
            console.error('Error deleting order:', error);
            alert(error.message || 'An error occurred.');
        }
    }

    // Function to open and populate the order details modal
    async function openOrderDetailsModal(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details.');
            }

            const order = await response.json();
            renderModalContent(order);
            orderDetailsModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('Could not load order details.');
        }
    }

    // Function to render content inside the modal
    function renderModalContent(order) {
        modalContent.innerHTML = `
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Customer:</strong> ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email})</p>
            <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
            
            <div class="my-4">
                <label for="order-status" class="block text-gray-700"><strong>Status:</strong></label>
                <select id="order-status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            
            <h4 class="font-bold mt-4 mb-2">Products:</h4>
            <ul>
                ${order.products.map(item => `
                    <li>${item.name} x ${item.quantity} ($${(item.quantity * item.priceAtOrder).toFixed(2)})</li>
                `).join('')}
            </ul>

            <h4 class="font-bold mt-4 mb-2">Shipping Address:</h4>
            <p>${order.shippingAddress.addressLine1 || ''}</p>
            ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ''}
            <p>${order.shippingAddress.city || ''}${order.shippingAddress.city && order.shippingAddress.state ? ', ' : ''}${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}</p>
            <p>${order.shippingAddress.country || ''}</p>
            ${order.shippingAddress.phone ? `<p>Phone: ${order.shippingAddress.phone}</p>` : ''}
        `;
        
        saveOrderBtn.dataset.orderId = order._id;
    }

    // Function to create a test order
    async function createTestOrder() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // This is a sample test order. You will need a customer ID and product IDs
                // that exist in your database for this to work. You can get these from
                // your `adminCustomers.html` and `adminProducts.html` pages.
                body: JSON.stringify({
                    customer: 'YOUR_CUSTOMER_ID_HERE', // Replace with an actual customer ID
                    products: [{
                        product: 'YOUR_PRODUCT_ID_HERE', // Replace with an actual product ID
                        name: 'Sample Product',
                        quantity: 2,
                        priceAtOrder: 25.00
                    }],
                    shippingAddress: {
                        addressLine1: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    billingAddress: {
                        addressLine1: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create test order.');
            }

            alert('Test order created successfully!');
            fetchOrders(currentPage, currentFilters); // Refresh the list to show the new order

        } catch (error) {
            console.error('Error creating test order:', error);
            alert(error.message || 'An error occurred while creating a test order.');
        }
    }


    // Save changes from modal
    saveOrderBtn.addEventListener('click', async () => {
        const orderId = saveOrderBtn.dataset.orderId;
        const newStatus = document.getElementById('order-status').value;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order.');
            }

            alert('Order updated successfully!');
            fetchOrders(currentPage, currentFilters); // Refresh list
            orderDetailsModal.classList.add('hidden'); // Close modal

        } catch (error) {
            console.error('Error updating order:', error);
            alert(error.message || 'An error occurred.');
        }
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        orderDetailsModal.classList.add('hidden');
    });

});
