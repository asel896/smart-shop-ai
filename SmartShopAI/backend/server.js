const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Ürün verisini JSON dosyasından al
app.get('/api/urunler', (req, res) => {
  fs.readFile('database.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Veri okunamadı');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// Yorum analizi ya da öneri motoru eklenmek istenirse buraya yeni endpointler eklenebilir.

app.listen(3000, () => {
  console.log('SmartShop sunucusu 3000 portunda çalışıyor');
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: 'YOUR_OPENAI_API_KEY'  // Hackathon’da anahtarı gizli tut!
});
const openai = new OpenAIApi(configuration);

app.post('/api/aciklama', async (req, res) => {
  const { prompt } = req.body;
  try {
    const gpt = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ content: gpt.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'GPT hatası' });
  }
});











app.post('/api/yorum', async (req, res) => {
  const { prompt } = req.body;
  try {
    const gpt = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ content: gpt.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Yorum analiz hatası' });
  }
});



app.use('/assets', express.static('assets'));