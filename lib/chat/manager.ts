import { generateLlmReply } from "../llm/responder";
import { sendTelegramMessage } from "../telegram/sendMessage";
import { findTelegramUser, upsertTelegramUser, TelegramUser } from "../users/db";
import { saveMessage } from "../messages/db";
import { findTelegramChat, upsertTelegramChat } from "../chats/upsertTelegramChat";

export interface TelegramChat {
  id: number;
  type?: string;
  title?: string;
}

export interface TelegramMessage {
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramUpdate {
  message?: TelegramMessage;
}

/**
 * Entry point for Telegram updates so we can evolve routing/LLM control here.
 */
export async function handleIncomingTelegramMessage(update: TelegramUpdate) {
  if (!update?.message?.chat) {
    return;
  }
  // console.log(update)

  let user = await findTelegramUser(update.message.from.id);
  if (!user) {
    const createdNewUser = await upsertTelegramUser(update.message.from);
    if (!createdNewUser) {
      return;
    }
    user = createdNewUser;
  }

  const telegramChatId = update.message.chat.id;
  let chat = await findTelegramChat(telegramChatId);
  if (!chat) {
    const createdNewChat = await upsertTelegramChat(update.message.chat);
    if (!createdNewChat) {
      return;
    }
    chat = createdNewChat;
  }

  const messageText = update.message.text;
  if (!messageText) {
    console.warn("Received non-text update; skipping Gemini call");
    return;
  }

  await saveMessage({
    userId: user.id,
    chatId: chat.id,
    role: "user",
    content: messageText,
  });

  const llmReply = await generateLlmReply({
    text: messageText,
    chatId: chat.id,
  });
  if (!llmReply) {
    console.error("Failed to generate LLM reply");
    return;
  }

  await saveMessage({
    userId: user.id,
    chatId: chat.id,
    role: "agent",
    content: llmReply,
  });
  await sendTelegramMessage({ telegramChatId, text: llmReply });
}
