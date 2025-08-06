const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'tr-TR';

function startVoiceSearch() {
  recognition.start();
  recognition.onresult = async function(e) {
    const query = e.results[0][0].transcript;
    document.getElementById('search-result').textContent = `Aranan: ${query}`;
    const response = await fetch('http://localhost:3000/api/aciklama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `${query} için uygun ürün önerisi ver.` })
    });
    const data = await response.json();
    document.getElementById('search-result').textContent += `\nÖneri: ${data.content}`;
  };
}