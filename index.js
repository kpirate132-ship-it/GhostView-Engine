const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('محرك GhostView - محرك الستوريات الحقيقي يعمل!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: '', followers: '-', following: '-', posts: '-',
            stories: [] 
        };

        if (platform === 'instagram') {
            // استخدام Imginn كمصدر أساسي للستوريات والبوستات
            const resp = await axios.get(`https://imginn.com/p/${username}/`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const $ = cheerio.load(resp.data);
            
            results.followers = $('.info .stats b').eq(1).text() || "-";
            results.following = $('.info .stats b').eq(2).text() || "-";
            results.posts = $('.info .stats b').eq(0).text() || "-";
            results.bio = $('.info .description').text().trim();

            $('.items .item').each((i, el) => {
                const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
                const isVideo = $(el).find('.video-icon').length > 0;
                if (img && i < 12) {
                    results.stories.push({
                        type: isVideo ? 'video' : 'image',
                        url: img.startsWith('//') ? 'https:' + img : img
                    });
                }
            });
        } 
        else if (platform === 'snapchat') {
            const resp = await axios.get(`https://story.snapchat.com/s/${username}`);
            const $ = cheerio.load(resp.data);
            $('video source').each((i, el) => {
                const src = $(el).attr('src');
                if (src && i < 6) results.stories.push({ type: 'video', url: src });
            });
            if(results.stories.length === 0) {
                $('img').each((i, el) => {
                    const src = $(el).attr('src');
                    if (src && src.includes('story')) results.stories.push({ type: 'image', url: src });
                });
            }
        }
        else if (platform === 'tiktok') {
            const resp = await axios.get(`https://urlebird.com/user/${username}/`);
            const $ = cheerio.load(resp.data);
            $('.thumb img').each((i, el) => {
                if (i < 9) results.stories.push({ type: 'video', url: $(el).attr('src') });
            });
            results.followers = $('.user-info .stats span').eq(1).text().split(' ')[0];
        }

        res.json(results);
    } catch (error) {
        res.status(404).json({ error: 'الحساب غير موجود أو تعذر جلب الستوريات' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Engine Ready`));
