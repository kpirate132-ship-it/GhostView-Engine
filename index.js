const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// متصفح وهمي لتجنب الحظر
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    }
};

app.get('/', (req, res) => res.send('محرك GhostView الحقيقي يعمل بنجاح!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: '', followers: '-', following: '-', posts: '-', stories: []
        };

        if (platform === 'instagram') {
            // استخدام وسيط Imginn لجلب البيانات الحقيقية بدون حساب
            const resp = await axios.get(`https://imginn.com/p/${username}/`, axiosConfig);
            const $ = cheerio.load(resp.data);
            
            results.bio = $('.info .description').text().trim() || "حساب إنستغرام عام";
            results.followers = $('.info .stats b').eq(1).text() || "Hidden";
            results.following = $('.info .stats b').eq(2).text() || "Hidden";
            results.posts = $('.info .stats b').eq(0).text() || "0";
            
            // جلب الستوريات والمنشورات الحقيقية
            $('.items .item img').each((i, el) => {
                let img = $(el).attr('data-src') || $(el).attr('src');
                if (img && i < 12) {
                    results.stories.push(img.startsWith('//') ? 'https:' + img : img);
                }
            });
        } 
        else if (platform === 'tiktok') {
            const resp = await axios.get(`https://urlebird.com/user/${username}/`, axiosConfig);
            const $ = cheerio.load(resp.data);
            
            results.bio = $('.user-info .info').text().trim();
            results.followers = $('.user-info .stats span').eq(1).text().split(' ')[0];
            results.following = $('.user-info .stats span').eq(0).text().split(' ')[0];
            
            $('.thumb img').each((i, el) => {
                if (i < 9) results.stories.push($(el).attr('src'));
            });
        }
        else if (platform === 'snapchat') {
            const resp = await axios.get(`https://story.snapchat.com/s/${username}`, axiosConfig);
            const $ = cheerio.load(resp.data);
            results.bio = "قصص سناب شات العامة المتاحة";
            $('img').each((i, el) => {
                let src = $(el).attr('src');
                if (src && src.includes('story') && i < 9) results.stories.push(src);
            });
        }

        res.json(results);
    } catch (error) {
        res.status(404).json({ error: 'الحساب خاص أو تعذر جلب البيانات حالياً' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Live`));
