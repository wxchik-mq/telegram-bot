import type { Chat } from "@prisma/client";
import { prisma } from "../db/prisma";

export interface TelegramChatInfo {
  id: number;
  type?: string;
  title?: string;
}

export async function findTelegramChat(telegramChatId: number): Promise<Chat | null> {
  const telegramId = BigInt(telegramChatId);

  return prisma.chat.findUnique({
    where: { telegramId },
  });
}

export async function upsertTelegramChat(chat: TelegramChatInfo): Promise<Chat | null> {
  const telegramId = BigInt(chat.id);

  const chatType = typeof chat.type === "string" && chat.type.trim() ? chat.type.trim() : "private";
  const title = typeof chat.title === "string" && chat.title.trim() ? chat.title.trim() : null;

  return prisma.chat.upsert({
    where: { telegramId },
    update: {
      type: chatType,
      title,
    },
    create: {
      telegramId,
      type: chatType,
      title,
    },
  });
}
