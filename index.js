const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // للسماح لموقعك في CodePen بالتحدث مع هذا السيرفر

app.get('/', (req, res) => res.send('محرك GhostView يعمل بنجاح!'));

// نقطة البحث الرئيسية
app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: '',
            followers: 'Public',
            stories: []
        };

        // إذا كان البحث في انستجرام
        if (platform === 'instagram') {
            const resp = await axios.get(`https://dumpoir.com/v/${username}`);
            const $ = cheerio.load(resp.data);
            results.bio = $('.profile-info-bio').text().trim();
            results.followers = $('.profile-info-stats .stat-value').eq(1).text();
        } 
        // إذا كان البحث في سناب
        else if (platform === 'snapchat') {
            const resp = await axios.get(`https://story.snapchat.com/s/${username}`);
            const $ = cheerio.load(resp.data);
            results.bio = "حساب سناب شات عام متاح للمشاهدة";
        }

        res.json(results);
    } catch (error) {
        res.status(404).json({ error: 'الحساب غير موجود أو خاص' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
