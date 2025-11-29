import { NextRequest } from "next/server";
import { handleIncomingTelegramMessage } from "../../../lib/chat/manager";

export async function POST(request: NextRequest) {
  try {
    const receivedUserMessage = await request.json();
    await handleIncomingTelegramMessage(receivedUserMessage);
  } catch (error) {
    console.error("Failed to process Telegram update", error);
  }

  return new Response("ok");
}
