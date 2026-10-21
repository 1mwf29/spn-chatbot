const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const update = req.body;
      
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        if (userText === '/start') {
          await bot.sendMessage(
            chatId, 
            'Halo! Saya Asisten Belajar AI. Silakan tanyakan materi pelajaran, konsep, atau diskusi soal kapan saja!'
          );
          return res.status(200).send('OK');
        }

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: userText,
          config: {
            systemInstruction: 'Kamu adalah tutor edukasi yang ramah, interaktif, dan komunikatif untuk siswa. Jawab dengan jelas, padat, dan gunakan bahasa yang mudah dipahami.'
          }
        });

        await bot.sendMessage(chatId, response.text);
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};
