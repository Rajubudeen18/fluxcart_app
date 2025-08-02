document.addEventListener("DOMContentLoaded", () => {
  fetchCustomers();
});

let selectedCustomerId = null;

function fetchCustomers() {
  fetch("http://localhost:5000/api/customers", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("customerBody");
      tbody.innerHTML = "";

      data.forEach((cust) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${cust.name}</td>
          <td>${cust.email}</td>
          <td>${cust.status}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="viewCustomer('${cust._id}')">View</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${cust._id}')">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      $('#customerTable').DataTable();
    });
}

function viewCustomer(id) {
  selectedCustomerId = id;
  fetch(`http://localhost:5000/api/customers/${id}`, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => res.json())
    .then((cust) => {
      document.getElementById("modalBody").innerHTML = `
        <p><strong>Name:</strong> ${cust.name}</p>
        <p><strong>Email:</strong> ${cust.email}</p>
        <p><strong>Status:</strong> ${cust.status}</p>
      `;
      new bootstrap.Modal(document.getElementById("viewModal")).show();
    });
}

document.getElementById("resetPwdBtn").addEventListener("click", () => {
  if (!selectedCustomerId) return;

  fetch(`http://localhost:5000/api/customers/${selectedCustomerId}/reset-password`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      Swal.fire("Temporary Password", data.tempPassword, "success");
    });
});

function deleteCustomer(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You are about to delete this customer!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`http://localhost:5000/api/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
        .then((res) => res.json())
        .then(() => {
          Swal.fire("Deleted!", "Customer has been deleted.", "success");
          fetchCustomers(); // reload
        });
    }
  });
}
