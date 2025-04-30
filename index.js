const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const FormData = require("form-data");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Используем переменную среды для порта (для Railway)

const qrFilePath = path.join(__dirname, "qr.png");

// WhatsApp Web клиент
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Telegram bot
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Генерация QR-кода сразу при запуске
const generateQR = async () => {
  try {
    console.log("✅ QR-код сгенерирован");
  } catch (err) {
    console.error("❌ Ошибка генерации QR:", err);
  }
};

// Эндпоинт для получения сохраненного QR-кода
app.get("/qr", (req, res) => {
  // Проверяем, существует ли файл
  if (fs.existsSync(qrFilePath)) {
    res.sendFile(qrFilePath); // Отправляем файл как изображение
  } else {
    res
      .status(404)
      .send("❌ QR-код не найден. Сначала его нужно сгенерировать.");
  }
});

// Логика для отправки QR в Telegram
client.on("qr", async (qr) => {
  try {
    await qrcode.toFile(qrFilePath, qr); // Генерация QR и сохранение в файл
  } catch (err) {
    console.error("❌ Ошибка при отправке QR в Telegram:", err.message);
  }
});

// Инициализация WhatsApp Web клиента
client.on("ready", () => {
  console.log("✅ WhatsApp client is ready!");
  generateQR(); // Генерация QR сразу после запуска
});

// Слушаем сообщения
client.on("message", async (message) => {
  console.log("📩 Новое сообщение:", message.body);

  const phone = message.from.split("@")[0];
  const name = message.author || phone;
  const str = message.body.trim().split(" ");
  const preResStr = str[str.length - 1];
  const session = (preResStr.split("_")[1] || "").trim();

  try {
    const res = await fetch(
      `${process.env.API_URI}/compare-data/${phone}/${session}/${name}`
    );
    if (res.ok) {
      await message.reply("Hello, our manager will contact you soon");
    }
  } catch (err) {
    console.error("Ошибка при запросе к API:", err.message);
  }
});

// Запускаем сервер Express
app.listen(port, () => {
  console.log(`QR-код сервер запущен на http://localhost:${port}`);
});

// Инициализация клиента WhatsApp
client.initialize();
