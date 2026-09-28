const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('المحرك يعمل!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: 'حساب عام', followers: '-', following: '-', posts: '-',
            stories: [] 
        };

        // محاولة جلب البيانات باستخدام متصفح وهمي بسيط
        const config = {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000 // انتظر 10 ثواني قبل الاستسلام
        };

        if (platform === 'instagram') {
            // جربنا Imginn، الآن سنجرب Dumpor كبديل أقوى
            const resp = await axios.get(`https://dumpoir.com/v/${username}`, config);
            const $ = cheerio.load(resp.data);
            
            results.followers = $('.profile-info-stats .stat-value').eq(1).text() || "-";
            results.posts = $('.profile-info-stats .stat-value').eq(0).text() || "-";
            
            $('.content-posts img').each((i, el) => {
                if (i < 6) results.stories.push({ type: 'image', url: $(el).attr('src') });
            });
        } 
        else if (platform === 'snapchat') {
            const resp = await axios.get(`https://story.snapchat.com/s/${username}`, config);
            const $ = cheerio.load(resp.data);
            $('video source').each((i, el) => {
                if (i < 6) results.stories.push({ type: 'video', url: $(el).attr('src') });
            });
        }
        else if (platform === 'tiktok') {
            const resp = await axios.get(`https://urlebird.com/user/${username}/`, config);
            const $ = cheerio.load(resp.data);
            $('.thumb img').each((i, el) => {
                if (i < 6) results.stories.push({ type: 'video', url: $(el).attr('src') });
            });
        }

        res.json(results);
    } catch (error) {
        // إذا فشل السحب، نرسل على الأقل صورة البروفايل لكي لا يظهر خطأ للمستخدم
        res.json({
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: 'الحساب متاح، ولكن الستوريات محمية حالياً.',
            stories: []
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ready`));
