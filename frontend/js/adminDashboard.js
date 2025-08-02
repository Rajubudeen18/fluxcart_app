document.addEventListener('DOMContentLoaded', () => {
  // Functions are called after the DOM is fully loaded.
  fetchStats();
});

const API_BASE_URL = "http://localhost:5000/api";

async function fetchStats() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return; // authCheck.js will handle redirect

    // Use Promise.all for concurrent fetching
    const [productsRes, customersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Add orders fetch here when ready
    ]);

    if (!productsRes.ok || !customersRes.ok) {
      // More specific error logging
      const productStatus = productsRes.statusText;
      const customerStatus = customersRes.statusText;
      console.error(`Failed to fetch stats data. Products: ${productStatus}, Customers: ${customerStatus}`);
      return;
    }

    const products = await productsRes.json();
    const customers = await customersRes.json();

    // Orders API not implemented, so set to zero for now
    const orderStats = { pending: 0, processing: 0, shipped: 0 }; // TODO: Fetch real order stats

    document.getElementById("totalProducts").textContent = products.length || 0;
    document.getElementById("totalCustomers").textContent = customers.length || 0;
    document.getElementById("pendingOrders").textContent = orderStats.pending;
    document.getElementById("processingOrders").textContent = orderStats.processing;
    document.getElementById("shippedOrders").textContent = orderStats.shipped;

    // Use the already-fetched customer data to render the users table
    renderUsers(customers);

  } catch (error) {
    console.error("Error fetching stats:", error);
    // Optionally update the UI to show an error state
    document.getElementById("totalProducts").textContent = "Error";
    document.getElementById("totalCustomers").textContent = "Error";
  }
}

// Renders the users table from a given array of user objects.
function renderUsers(users) {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";

    users.forEach(user => {
      // Use firstName and lastName, and assume 'Customer' role for this view.
      const row = `
        <tr>
          <td>${user.firstName || ''} ${user.lastName || ''}</td>
          <td>${user.email}</td>
          <td>Customer</td>
          <td>
            <button class="btn btn-warning btn-sm" data-id="${user._id}" onclick="blockUser('${user._id}')">Block</button>
            <button class="btn btn-danger btn-sm" data-id="${user._id}" onclick="deleteUser('${user._id}')">Delete</button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
}

async function blockUser(userId) {
  try {
    // TODO: This function is a stub.
    // Implement API call to toggle user status (e.g., active/blocked).
    alert(`Block/unblock user with ID: ${userId} - Implement API call`);
  } catch (err) {
    console.error("Error blocking user:", err);
  }
}

async function deleteUser(userId) {
  try {
    const token = localStorage.getItem("token");
    const confirmed = confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    const res = await fetch(`${API_BASE_URL}/customers/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert("User deleted successfully");
      fetchUsers();
    } else {
      alert("Failed to delete user");
    }
  } catch (err) {
    console.error("Error deleting user:", err);
  }
}
