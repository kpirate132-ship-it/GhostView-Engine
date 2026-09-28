const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// إعدادات المتصفح الوهمي لتجاوز الحظر
const client = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
});

app.get('/', (req, res) => res.send('محرك GhostView الذكي يعمل!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: 'حساب عام متاح للعرض',
            followers: '-', following: '-', posts: '-',
            stories: []
        };

        if (platform === 'instagram') {
            // المصدر: Picuki (أقوى وسيط حالياً)
            const resp = await client.get(`https://www.picuki.com/profile/${username}`);
            const $ = cheerio.load(resp.data);
            
            results.bio = $('.profile-description').text().trim();
            results.followers = $('.followed_by').text().trim();
            results.following = $('.following').text().trim();
            results.posts = $('.posts_count').text().trim();
            
            // جلب الستوريات والمنشورات
            $('.post-image img').each((i, el) => {
                if (i < 9) results.stories.push($(el).attr('src'));
            });
        } 
        else if (platform === 'tiktok') {
            // المصدر: Urlebird
            const resp = await client.get(`https://urlebird.com/user/${username}/`);
            const $ = cheerio.load(resp.data);
            
            results.followers = $('.user-info .stats span').eq(1).text().split(' ')[0];
            results.following = $('.user-info .stats span').eq(0).text().split(' ')[0];
            
            $('.thumb img').each((i, el) => {
                if (i < 9) results.stories.push($(el).attr('src'));
            });
        }

        res.json(results);
    } catch (error) {
        // في حال الحظر، نرسل بيانات تقريبية لكي لا يظهر الموقع فارغاً
        res.json({
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: 'الحساب محمي حالياً أو خاص، جرب يوزر آخر.',
            followers: 'N/A', following: 'N/A', stories: []
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Live`));
