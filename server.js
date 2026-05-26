const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const app = express();
app.use(express.json());

// Разрешаем кросс-доменные запросы от вашей HTML-формы
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// --- Инициализация Discord бота ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} запущен и готов к работе!`);
});
client.login(DISCORD_TOKEN);

app.get('/', (req, res) => {
    res.send('🚀 Сервер Vendeta Form Bot работает. Отправляйте POST-запросы на /submit-form');
});

// --- API endpoint, который будет принимать POST-запросы с формы ---
app.post('/submit-form', async (req, res) => {
    const data = req.body;
    console.log('Получена новая заявка:', data);

    // Проверка обязательных полей
    if (!data.nickname || !data.ic_age || !data.ooc_age) {
        return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля.' });
    }

    // Создаём красивое сообщение для Discord
    const embed = new EmbedBuilder()
        .setColor(0xaa2e2e) // Красный цвет семьи Vendeta
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
        if (!channel) throw new Error('Канал не найден');
        await channel.send({ embeds: [embed] });
        res.status(200).json({ message: '✅ Заявка успешно ушла братве!' });
    } catch (err) {
        console.error('Ошибка отправки в Discord:', err);
        res.status(500).json({ error: '❌ Не удалось отправить заявку. Попробуйте позже.' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Веб-сервер готов и слушает порт ${PORT}`);
});