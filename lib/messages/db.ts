import { prisma } from "../db/prisma";

export type MessageRole = "user" | "agent";

export interface SimpleMessageDto {
  role: MessageRole;
  content: string;
}

interface SaveMessageDto {
  userId: number;
  chatId: number;
  role: MessageRole;
  content: string;
}

export async function saveMessage(messageDto: SaveMessageDto) {
  if (!messageDto.content) {
    return;
  }

  await prisma.message.create({
    data: {
      userId: messageDto.userId,
      chatId: messageDto.chatId,
      role: messageDto.role,
      content: messageDto.content,
    },
  });
}

export async function getRecentMessagesForLlm(chatId: number, limit = 14): Promise<SimpleMessageDto[]> {
  if (!chatId || limit <= 0) {
    return [];
  }

  const rawMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [];
  }

  return rawMessages.reverse().map((message) => ({
    role: message.role === "agent" ? "agent" : "user",
    content: message.content ?? "",
  }));
}
