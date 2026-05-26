const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const app = express();
app.use(express.json());

// CORS для запросов с других доменов
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// --- Discord bot ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GREETING_SENT = process.env.GREETING_SENT === 'true';

client.once('ready', async () => {
    console.log(`✅ Бот ${client.user.tag} запущен`);

    if (!GREETING_SENT) {
        try {
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) throw new Error('Канал не найден');

            // Определяем базовый URL (домен Railway)
            const baseUrl = process.env.RAILWAY_STATIC_URL 
                ? `https://${process.env.RAILWAY_STATIC_URL}` 
                : 'https://vendeta-bot-production.up.railway.app';

            // Текст сообщения с пингом everyone и кликабельной ссылкой
            const messageText = `@everyone\n**Бот Vendeta готов принимать заявки!**\nПерейти к [Форме](${baseUrl}) и подать заявку в семью.`;

            await channel.send(messageText);
            console.log('✅ Приветствие с пингом отправлено');
        } catch (err) {
            console.error('Ошибка при отправке приветствия:', err);
        }
    } else {
        console.log('Приветствие уже было отправлено ранее');
    }
});

client.login(TOKEN);

// --- Обработка формы ---
app.post('/submit-form', async (req, res) => {
    const data = req.body;
    console.log('Заявка:', data);

    if (!data.nickname || !data.ic_age || !data.ooc_age) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    const embed = new EmbedBuilder()
        .setColor(0xaa2e2e)
        .setTitle('📜 Новая заявка в Vendeta')
        .addFields(
            { name: '🏍️ Погоняло', value: data.nickname, inline: true },
            { name: '🔫 IC возраст', value: data.ic_age.toString(), inline: true },
            { name: '💻 OOC возраст', value: data.ooc_age.toString(), inline: true },
            { name: '🗺️ Лет в штате', value: data.years_in_state.toString(), inline: true },
            { name: '⏳ Время на инвайты', value: data.hours_per_week, inline: true },
            { name: '⚙️ Рекрутинг при 19/20', value: data.will_recruit_at_19_20, inline: true },
            { name: '📜 Опыт рекрутинга', value: data.recruit_experience || 'Не указан', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Vendeta Family' });

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send({ embeds: [embed] });
        res.status(200).json({ message: 'Заявка отправлена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка Discord' });
    }
});

// Отдача HTML-формы, если она в том же проекте
const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));