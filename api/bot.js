const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const update = req.body;

      // 1. Tangani Pesan Teks
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        // Command /start atau /menu
        if (userText === '/start' || userText === '/menu') {
          const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📝 Latihan Kuis', callback_data: 'menu_kuis' },
                  { text: '📚 Rangkuman Materi', callback_data: 'menu_materi' }
                ],
                [
                  { text: '💡 Studi Kasus', callback_data: 'menu_kasus' },
                  { text: '🎯 Game Tebak Tokoh', callback_data: 'menu_game' }
                ],
                [
                  { text: '❓ Cara Penggunaan', callback_data: 'menu_bantuan' }
                ]
              ]
            }
          };

          const pesanSelamatDatang = 
            `👋 *Selamat Datang di Asisten Belajar AI!*\n\n` +
            `Aku siap bantu kamu belajar Pendidikan Pancasila, diskusi soal, atau jawab pertanyaan materi kapan aja.\n\n` +
            `Silakan pilih menu di bawah ini atau langsung ketik pertanyaanmu secara bebas ya!`;

          await bot.sendMessage(chatId, pesanSelamatDatang, opts);
          return res.status(200).send('OK');
        }

        // Respon Teks Biasa via Gemini
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `Kamu adalah tutor edukasi Pendidikan Pancasila yang ramah, interaktif, dan komunikatif untuk siswa SMP/SMA. Jawab pertanyaan berikut dengan jelas dan mudah dipahami: ${userText}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          await bot.sendMessage(chatId, response.text());
        } catch (aiErr) {
          console.error('Gemini Error:', aiErr);
          await bot.sendMessage(chatId, 'Maaf, terjadi kendala saat terhubung ke AI. Coba tanyakan lagi ya!');
        }
      }

      // 2. Tangani Tombol Menu
      if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const action = update.callback_query.data;

        let promptAI = '';

        if (action === 'menu_kuis') {
          promptAI = 'Buatkan 1 soal kuis pilihan ganda singkat tentang Pendidikan Pancasila / UUD 1945 beserta opsi A-D, kunci jawaban, dan pembahasan singkatnya.';
        } else if (action === 'menu_materi') {
          await bot.sendMessage(chatId, '📚 *Rangkuman Materi*\n\nSilakan ketik topik yang ingin kamu rangkum (contoh: *UUD 1945*, *Hak dan Kewajiban*, *Pancasila*, atau *Bhinneka Tunggal Ika*).', { parse_mode: 'Markdown' });
          return res.status(200).send('OK');
        } else if (action === 'menu_kasus') {
          promptAI = 'Berikan 1 skenario studi kasus singkat tentang penerapan nilai Pancasila atau norma di sekolah/masyarakat untuk bahan diskusi siswa.';
        } else if (action === 'menu_game') {
          promptAI = 'Berikan 3 petunjuk (clue) tebak tokoh pahlawan/pendiri bangsa Indonesia tanpa menyebutkan namanya dulu, lalu minta pengguna menebak siapa tokoh tersebut.';
        } else if (action === 'menu_bantuan') {
          const pesanBantuan = 
            `ℹ️ *Cara Penggunaan Bot:*\n\n` +
            `1️⃣ *Klik Tombol Menu:* Pilih menu di atas untuk kuis, game, atau studi kasus cepat.\n` +
            `2️⃣ *Tanya Bebas:* Ketik soal atau materi apa saja langsung di chat ini.\n` +
            `3️⃣ *Bebas Akses:* Bebas dipakai 24 jam tanpa batasan kredit!\n\n` +
            `Ketik /menu kapan saja untuk menampilkan tombol menu lagi.`;
          await bot.sendMessage(chatId, pesanBantuan, { parse_mode: 'Markdown' });
          return res.status(200).send('OK');
        }

        if (promptAI) {
          await bot.sendMessage(chatId, '⏳ *Sedang menyiapkan respon...*', { parse_mode: 'Markdown' });
          try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(promptAI);
            const response = await result.response;
            await bot.sendMessage(chatId, response.text());
          } catch (aiErr) {
            console.error('Gemini Error:', aiErr);
            await bot.sendMessage(chatId, 'Gagal mengambil data dari AI, coba klik tombolnya sekali lagi ya.');
          }
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).send('Error');
  }
};
