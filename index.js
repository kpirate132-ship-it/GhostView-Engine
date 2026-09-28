const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('محرك GhostView المطور يعمل بنجاح!'));

app.get('/api/search/:platform/:username', async (req, res) => {
    const { platform, username } = req.params;
    
    try {
        let results = {
            username: username,
            avatar: `https://unavatar.io/${platform}/${username}`,
            bio: '',
            followers: '',
            stories: [] // مصفوفة الستوريات
        };

        if (platform === 'instagram') {
            // استخدام وسيط متطور لجلب البيانات الحقيقية
            const resp = await axios.get(`https://dumpoir.com/v/${username}`);
            const $ = cheerio.load(resp.data);
            
            results.bio = $('.profile-info-bio').text().trim() || "حساب انستقرام عام";
            results.followers = $('.profile-info-stats .stat-value').eq(1).text() || "-";
            
            // استخراج روابط صور الستوريات المتاحة
            $('.content-posts img').each((i, el) => {
                let imgUrl = $(el).attr('src');
                if (imgUrl) results.stories.push(imgUrl);
            });
        } 
        else if (platform === 'snapchat') {
            const resp = await axios.get(`https://story.snapchat.com/s/${username}`);
            const $ = cheerio.load(resp.data);
            results.bio = "قصص سناب شات العامة المكتشفة";
            
            $('img').each((i, el) => {
                let src = $(el).attr('src');
                if (src && src.includes('story')) results.stories.push(src);
            });
        }
        else if (platform === 'tiktok') {
            results.bio = "حساب تيك توك متاح للمشاهدة";
            results.stories = [results.avatar]; // تيك توك يعرض البروفايل كبداية
        }

        res.json(results);
    } catch (error) {
        res.status(404).json({ error: 'الحساب خاص أو لا توجد ستوريات' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Live`));
