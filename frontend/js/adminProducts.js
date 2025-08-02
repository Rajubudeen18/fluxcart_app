let products = [];
let currentPage = 1;
const pageSize = 20;
let filteredProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
});
function fetchProducts() {
  const token = localStorage.getItem('token');
  fetch("http://127.0.0.1:5000/api/products", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      products = data;
      filteredProducts = [...products];
      renderTable();
      renderPagination();
    })
    .catch(err => console.error("Error fetching products:", err));
}
function renderTable() {
  const tbody = document.getElementById("productBody");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((product, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${product.name}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>${product.stock_quantity}</td>
      <td>
        <button onclick="editProduct('${product._id}')">✏️ Edit</button>
        <button onclick="confirmDelete('${product._id}')">🗑️ Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}
function searchProducts() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  filteredProducts = products.filter(p => p.name.toLowerCase().includes(query));
  currentPage = 1;
  renderTable();
  renderPagination();
}
function sortProducts() {
  const sortBy = document.getElementById("sortSelect").value;

  if (sortBy === "name") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "price") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "stock_quantity") {
    filteredProducts.sort((a, b) => a.stock_quantity - b.stock_quantity);
  }

  renderTable();
}
function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
    });

    pagination.appendChild(btn);
  }
}
function showAddModal() {
  document.getElementById("modalTitle").textContent = "Add Product";
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  clearImagePreview();
  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

function clearImagePreview() {
  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }
  const imageInput = document.getElementById("imageInput");
  if (imageInput) {
    imageInput.value = "";
  }
}

function showImagePreview(imageUrl) {
  let preview = document.getElementById("imagePreview");
  if (!preview) {
    preview = document.createElement("img");
    preview.id = "imagePreview";
    preview.style.maxWidth = "100%";
    preview.style.marginTop = "10px";
    const form = document.getElementById("productForm");
    form.insertBefore(preview, form.querySelector("button[type='submit']"));
  }
  preview.src = imageUrl;
  preview.style.display = "block";
}

function editProduct(id) {
  const product = products.find(p => p._id === id);
  document.getElementById("modalTitle").textContent = "Edit Product";
  document.getElementById("productId").value = product._id;
  document.getElementById("name").value = product.name;
  document.getElementById("description").value = product.description;
  document.getElementById("price").value = product.price;
  document.getElementById("stock_quantity").value = product.stock_quantity;
  clearImagePreview();
  if (product.image) {
    showImagePreview(product.image);
  }
  document.getElementById("productModal").style.display = "block";
}

async function submitProduct(event) {
  event.preventDefault();

  const productId = document.getElementById("productId").value;
  const productData = new FormData();

  // Append form fields to FormData
  productData.append('name', document.getElementById("name").value);
  productData.append('description', document.getElementById("description").value);
  productData.append('price', document.getElementById("price").value);
  productData.append('stock_quantity', document.getElementById("stock_quantity").value);

  // Append image file if selected
  const imageInput = document.getElementById("imageInput");
  if (imageInput.files.length > 0) {
    productData.append('image', imageInput.files[0]);
  }

  const url = productId 
    ? `http://127.0.0.1:5000/api/products/${productId}` 
    : "http://127.0.0.1:5000/api/products";
  const method = productId ? "PUT" : "POST";
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        // Do NOT set 'Content-Type': 'multipart/form-data'.
        // The browser will automatically set it with the correct boundary.
        Authorization: `Bearer ${token}`
      },
      body: productData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error: ${res.status} ${text}`);
    }

    // Response might be empty on success, so handle that.
    try {
      await res.json();
    } catch {}

    closeModal();
    fetchProducts();
  } catch (err) {
    console.error("Save failed:", err);
    alert("Save failed. Please try again.");
  }
}

function confirmDelete(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    deleteProduct(id);
  }
}

function deleteProduct(id) {
  const token = localStorage.getItem('token');
  fetch(`http://127.0.0.1:5000/api/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(() => fetchProducts())
    .catch(err => console.error("Delete failed:", err));
}
