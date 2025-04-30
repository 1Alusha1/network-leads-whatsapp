const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const dotenv = require("dotenv");

dotenv.config();


const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "/data" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
});

const telegramBotToken = procces.env.BOT_TOKEN  // Укажи свой токен бота
const chatId = 7325647133;  // Укажи свой ID чата

client.on('qr', (qr) => {
  // Генерируем QR и сохраняем в файл
  qrcode.toFile('qr.png', qr, (err) => {
    if (err) {
      console.error('Ошибка при генерации QR:', err);
      return;
    }

    // Отправляем изображение через fetch
    sendQrToTelegram('qr.png');
  });
});

client.on("ready", () => {
  console.log("✅ WhatsApp client is ready!");
});

client.on("message", async (message) => {
  console.log("📩 Новое сообщение:", message.body);

  const phone = message.from.split("@")[0];
  const name = message.author || phone; // защита от undefined
  const str = message.body.trim().split(" ");
  const preResStr = str[str.length - 1];
  const session = (preResStr.split('_')[1] || "").trim();

  if (!session) {
    return; // нет session id — игнорируем
  }

  try {
    const res = await fetch(`${process.env.API_URI}/compare-data/${phone}/${session}/${name}`);
    if (res.ok) {
      await message.reply("Hello, our manager will contact you soon");
    }
  } catch (err) {
    console.error("Ошибка при запросе к API:", err.message);
  }
});

async function sendQrToTelegram(imagePath) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', fs.createReadStream(imagePath));  // Читаем изображение

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.ok) {
      console.log('QR-код успешно отправлен в Telegram!');
    } else {
      console.log('Ошибка отправки в Telegram:', result.description);
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса:', error.message);
  }
}

client.initialize();
