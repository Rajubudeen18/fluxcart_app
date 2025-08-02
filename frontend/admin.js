document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Not authorized. Please login.');
    window.location.href = '/login.html';
    return;
  }

  // Fetch and display products
  fetch('/api/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById('productList');
      container.innerHTML = '';
      if (Array.isArray(products)) {
        products.forEach(product => {
          const div = document.createElement('div');
          div.className = 'product-item';
          div.innerHTML = `
            <h3>${product.name}</h3>
            <p>Price: ₹${product.price}</p>
            <button onclick="editProduct('${product._id}', '${product.name}', ${product.price})">Edit</button>
            <button onclick="deleteProduct('${product._id}')">Delete</button>
          `;
          container.appendChild(div);
        });
      } else {
        container.innerHTML = `<p>No products found or unauthorized.</p>`;
      }
    })
    .catch(err => {
      console.error('Error fetching products:', err);
    });

  // Handle Add Product form submission
  const form = document.getElementById('addProductForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value;
      const price = form.price.value;

      fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, price })
      })
        .then(res => res.json())
        .then(data => {
          alert('Product added!');
          location.reload(); // Refresh product list
        })
        .catch(err => {
          console.error('Error adding product:', err);
        });
    });
  }
});

// Delete product
function deleteProduct(id) {
  const token = localStorage.getItem('token');
  if (!confirm('Are you sure to delete this product?')) return;

  fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      alert('Product deleted!');
      location.reload();
    })
    .catch(err => {
      console.error('Error deleting product:', err);
    });
}

// Edit product
function editProduct(id, oldName, oldPrice) {
  const newName = prompt('Enter new name:', oldName);
  const newPrice = prompt('Enter new price:', oldPrice);
  const token = localStorage.getItem('token');

  if (newName && newPrice) {
    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName, price: newPrice })
    })
      .then(res => res.json())
      .then(data => {
        alert('Product updated!');
        location.reload();
      })
      .catch(err => {
        console.error('Error updating product:', err);
      });
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}
