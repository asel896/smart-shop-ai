let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Sepete ürün ekle
function addToCart(productName, price = 0) {
  const existing = cart.find(item => item.name === productName);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ name: productName, price, quantity: 1 });
  }
  saveCart();
  updateCart();
  alert(`${productName} sepete eklendi.`);
}

// Sepet listesini güncelle
function updateCart() {
  const list = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');

  if (list) {
    list.innerHTML = '';
    let total = 0;

    cart.forEach((product, index) => {
      const li = document.createElement('li');
      const itemTotal = product.price * product.quantity;
      total += itemTotal;

      li.innerHTML = `
        ${product.name} x${product.quantity} - ₺${itemTotal}
        <button onclick="decreaseQuantity(${index})">-</button>
        <button onclick="removeFromCart(${index})">🗑️</button>
      `;

      list.appendChild(li);
    });

    if (totalEl) {
      totalEl.textContent = `Toplam: ₺${total}`;
    }
  }

  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    cartCountEl.textContent = cart.reduce((sum, p) => sum + p.quantity, 0);
  }
}

// Sepetten ürün sil
function removeFromCart(index) {
  const product = cart[index];
  if (confirm(`"${product.name}" ürününü sepetten kaldırmak istiyor musunuz?`)) {
    cart.splice(index, 1);
    saveCart();
    updateCart();
  }
}

// Ürün adedini azalt (1’e düşerse otomatik siler)
function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    removeFromCart(index);
    return;
  }
  saveCart();
  updateCart();
}

// Ödeme işlemi
function checkout() {
  if (cart.length === 0) {
    alert('Sepetiniz boş.');
    return;
  }
  alert('Ödeme başarılı! 🎉');
  cart = [];
  saveCart();
  updateCart();
}

// Sepeti kaydet
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Sayfa yüklendiğinde sepeti güncelle
document.addEventListener('DOMContentLoaded', updateCart);
