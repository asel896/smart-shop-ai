async function generateProductDescription(productName) {
  const response = await fetch('http://localhost:3000/api/aciklama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: `${productName} için e-ticaret açıklaması üret:` })
  });
  const data = await response.json();
  document.getElementById('description-area').innerText = data.content;
}