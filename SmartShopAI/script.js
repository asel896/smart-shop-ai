fetch('product.json')
  .then(response => response.json())
  .then(products => {
    const grid = document.querySelector('.product-grid');
    grid.innerHTML = ''; // Mevcut kartları temizle

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>₺${product.price}</p>
        <a href="product-detail.html?id=${product.id}" class="card-btn">İncele</a>
      `;
      grid.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Ürünler yüklenemedi:', error);
  });