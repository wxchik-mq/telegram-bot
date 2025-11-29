const TELEGRAM_API_BASE = "https://api.telegram.org";
const token = process.env.TELEGRAM_BOT_TOKEN;

interface SendTelegramMessageDto {
  telegramChatId: number;
  text: string;
}

export async function sendTelegramMessage(sendDto: SendTelegramMessageDto) {
  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN in environment");
    return;
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const body = JSON.stringify({
    chat_id: sendDto.telegramChatId,
    text: sendDto.text,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Failed to send Telegram message", response.status, errorText);
    }
  } catch (error) {
    console.error("Error sending Telegram message", error);
  }
}
