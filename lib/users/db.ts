import type { User } from "@prisma/client";
import { prisma } from "../db/prisma";

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

function toBigIntId(id: number) {
  try {
    return BigInt(id);
  } catch (error) {
    console.error("Unable to convert Telegram user id to BigInt", id, error);
    return null;
  }
}

export async function findTelegramUser(telegramUserId?: number): Promise<User | null> {
  if (!telegramUserId) {
    return null;
  }

  const telegramId = toBigIntId(telegramUserId);
  if (!telegramId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { telegramId },
  });
}

export async function upsertTelegramUser(user?: TelegramUser): Promise<User | null> {
  if (!user?.id) {
    return null;
  }

  const telegramId = toBigIntId(user.id);
  if (!telegramId) {
    return null;
  }

  return prisma.user.upsert({
    where: { telegramId },
    update: {
      isBot: user.is_bot ?? false,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      languageCode: user.language_code ?? null,
    },
    create: {
      telegramId,
      isBot: user.is_bot ?? false,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      languageCode: user.language_code ?? null,
    },
  });
}
