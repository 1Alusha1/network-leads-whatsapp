const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();


const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "/data" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
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

client.initialize();