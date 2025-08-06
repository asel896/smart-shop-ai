// backend sunucusu
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const products = require('./products.json'); // Ürün verilerini yükle
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware'ler
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Frontend dosyalarını sunmak için

// Gemini API anahtarını al ve kontrol et
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("HATA: GEMINI_API_KEY çevre değişkeni tanımlanmadı. Lütfen .env dosyasını kontrol edin ve API anahtarınızı buraya ekleyin.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// Yardımcı fonksiyon: Ürünleri filtreleme (artık sadece AI'dan gelen parametrelerle çalışacak)
function filterProducts(extractedInfo) {
    const { keywords, category, price_min, price_max, features } = extractedInfo;

    return products.filter(product => {
        const prodKeywords = (product.keywords || []).map(k => k.toLowerCase());
        const prodCategory = (product.category || '').toLowerCase();
        const prodFeatures = (product.features || []).map(f => f.toLowerCase());
        const prodName = (product.name || '').toLowerCase();
        const prodDescription = (product.description || '').toLowerCase();

        // Kategori eşleşmesi
        const categoryMatch = !category || prodCategory.includes(category.toLowerCase());

        // Fiyat aralığı eşleşmesi
        const priceMatch = (price_min === null || product.price >= price_min) &&
                            (price_max === null || product.price <= price_max);

        // Anahtar kelime ve özellik eşleşmesi (daha geniş bir eşleştirme)
        const keywordFeatureMatch = (keywords.length === 0 && features.length === 0) ||
                                    keywords.some(k => 
                                        prodName.includes(k.toLowerCase()) || 
                                        prodDescription.includes(k.toLowerCase()) || 
                                        prodKeywords.includes(k.toLowerCase()) ||
                                        prodFeatures.includes(k.toLowerCase())
                                    ) ||
                                    features.some(f => prodFeatures.includes(f.toLowerCase()));

        return categoryMatch && priceMatch && keywordFeatureMatch;
    });
}

// API Endpoint 1: Akıllı Arama ve Ürün Önerme
app.post('/api/search-products', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Sorgu metni boş olamaz.' });
    }

    try {
        const prompt = `Kullanıcının şu ürün arama sorgusundan anahtar kelimeler (ürün tipi, anahtar terimler), ana kategori, fiyat aralığı (min, max) ve önemli özellikler (ürünün spesifik nitelikleri, kullanım amacı gibi) çıkar. Çıkan bilgileri aşağıdaki JSON formatında ver. Eğer bilgi mevcut değilse ilgili alanı boş bırak veya null yap:
        {
            "keywords": ["string", "string"],
            "category": "string",
            "price_min": number,
            "price_max": number,
            "features": ["string", "string"]
        }

        Sorgu: '${query}'
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text(); // Gemini'den gelen ham metin yanıtı

        // Gemini bazen JSON çıktısını '```json\n...\n```' içinde verir. Bu yüzden Regex ile ayıklamalıyız.
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text; // Eğer ```json``` bloğu yoksa tüm metni al

        let extractedInfo;
        try {
            extractedInfo = JSON.parse(jsonString); // JSON'u parse et
        } catch (parseError) {
            console.error("JSON parse hatası:", parseError);
            console.error("Gemini'den gelen ham metin:", text);
            return res.status(500).json({ 
                error: 'Yapay zeka yanıtı işlenirken bir sorun oluştu. Lütfen sorgunuzu netleştirin veya tekrar deneyin.', 
                details: parseError.message 
            });
        }

        console.log("Gemini'den çıkarılan bilgiler:", extractedInfo);

        const filteredProducts = filterProducts(extractedInfo);

        res.json({ products: filteredProducts, geminiRawResponse: text, extractedInfo: extractedInfo });

    } catch (error) {
        console.error("API veya sunucu hatası:", error);
        res.status(500).json({ error: 'Ürün arama sırasında bir hata oluştu.', details: error.message });
    }
});

// API Endpoint 2: Ürün Detay Bilgisi (ID ile)
app.get('/api/product/:id', (req, res) => {
    const productId = req.params.id;
    const product = products.find(p => p.id === productId);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Ürün bulunamadı.' });
    }
});

// API Endpoint 3: Ürün Karşılaştırma (Gemini Destekli)
app.post('/api/compare-products', async (req, res) => {
    const { productIds } = req.body; // Örnek: ["1", "3"]

    if (!productIds || productIds.length < 2) {
        return res.status(400).json({ error: 'Karşılaştırmak için en az iki ürün ID\'si gönderilmelidir.' });
    }

    const productsToCompare = products.filter(p => productIds.includes(p.id));

    if (productsToCompare.length !== productIds.length) {
        return res.status(404).json({ error: 'Belirtilen ürünlerden bazıları bulunamadı.' });
    }

    const comparisonPrompt = `Aşağıdaki ürünlerin temel özelliklerini ve farklarını karşılaştır. Karşılaştırmayı madde madde ve anlaşılır bir şekilde yap. Her ürünün adını net bir şekilde belirt.
    ${productsToCompare.map(p => `Ürün Adı: ${p.name}\nAçıklama: ${p.description}\nFiyat: ${p.price} TL\nÖzellikler: ${p.features ? p.features.join(', ') : 'Yok'}`).join('\n\n')}
    `;

    try {
        const result = await geminiModel.generateContent(comparisonPrompt);
        const response = await result.response;
        const comparisonText = response.text();

        res.json({ comparison: comparisonText, productsCompared: productsToCompare });

    } catch (error) {
        console.error("Ürün karşılaştırma hatası:", error);
        res.status(500).json({ error: 'Ürün karşılaştırma sırasında bir hata oluştu.', details: error.message });
    }
});

// API Endpoint 4: Tüm Kategorileri Getirme -- ARTIK DOĞRU YERDE!
app.get('/api/categories', (req, res) => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    res.json({ categories: uniqueCategories.filter(Boolean) }); // Boş/null kategorileri filtrele
});


// Sunucuyu başlat
app.listen(port, () => {
    console.log(`SmartShopAI Backend http://localhost:${port} adresinde çalışıyor.`);
});

/*
filterProducts Fonksiyonu: Ürün filtreleme mantığı ayrı bir fonksiyona taşındı, bu da kodu daha okunaklı ve yönetilebilir yapıyor.
API Endpoint 2 (/api/product/:id): Belirli bir ürünün ID'si ile detaylarını getirmek için yeni bir GET endpoint'i eklendi. Bu, ürün detay sayfası için kullanılacak.
API Endpoint 3 (/api/compare-products): İki veya daha fazla ürünün ID'lerini alıp Gemini'ye göndererek karşılaştırma metni üretmesini sağlayan yeni bir POST endpoint'i eklendi
*/