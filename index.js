const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

app.get('/', (req, res) => res.send('محرك GhostView الشامل يعمل بأقصى قوة!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let data = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: '', followers: '-', following: '-', posts: '-', stories: []
        };

        if (platform === 'instagram') {
            // محاولة أولى عبر Imginn
            const resp = await axios.get(`https://imginn.com/p/${username}/`, { headers: { 'User-Agent': UA } });
            const $ = cheerio.load(resp.data);
            
            data.followers = $('.info .stats b').eq(1).text() || "-";
            data.following = $('.info .stats b').eq(2).text() || "-";
            data.posts = $('.info .stats b').eq(0).text() || "0";
            data.bio = $('.info .description').text().trim();

            $('.items .item').each((i, el) => {
                const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
                if (img && i < 12) {
                    data.stories.push(img.startsWith('//') ? 'https:' + img : img);
                }
            });
        } 
        else if (platform === 'tiktok') {
            // استخدام تيك توك ويب الرسمي + وسيط
            const resp = await axios.get(`https://urlebird.com/user/${username}/`, { headers: { 'User-Agent': UA } });
            const $ = cheerio.load(resp.data);
            
            data.followers = $('.user-info .stats span').eq(1).text() || "Public";
            $('.thumb img').each((i, el) => {
                if (i < 9) data.stories.push($(el).attr('src'));
            });
        }

        res.json(data);
    } catch (error) {
        res.status(404).json({ error: 'عذراً، هذا الحساب محمي أو غير موجود حالياً.' });
    }
});

app.listen(process.env.PORT || 3000);
