async function analyzeComment(commentText) {
  const response = await fetch('http://localhost:3000/api/yorum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: `Bu yorumu duygu yönünden değerlendir: ${commentText}` })
  });
  const data = await response.json();
  return data.content; // Örn: “Bu yorum olumlu duygular içeriyor.”
}