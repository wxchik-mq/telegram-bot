import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnablePassthrough } from "@langchain/core/runnables";
import type { Document } from "@langchain/core/documents";
import { getRecentMessagesForLlm, type SimpleMessageDto, } from "../messages/db";
import { retrieveRelevantKnowledge } from "../knowledgeBase";

interface GenerateLlmReplyDto extends Record<string, unknown> {
  text: string;
  chatId: number;
}

type ResponseChain = ReturnType<typeof buildResponseChain>;
let llmInstance: ChatGoogleGenerativeAI | null = null;
let responseChain: ResponseChain | null = null;
let detector: any = null;

async function detectLanguageWithLLM(dto: GenerateLlmReplyDto) {
  const llm = getLLM();
  if (!llm) {
    return 'eng';
  }

  const prompt = `
  You are a language detection assistant.
  Task:
  - Detect the language of the given text.
  - Return the ISO 639-3 language code (three-letter code, e.g., "eng" for English, "fra" for French, "zho" for Chinese).
  - Do NOT return anything else — just the 3-letter code.
  - For mixed-language text, return the language that is dominant. If unsure, pick the language that conveys most meaning.
  - If the text is very short or slangy (like "wad is ur business hour"), still return the correct language code.

  Text: """${dto.text}"""
  `;
  const result = await llm.invoke(prompt);
  console.log("LLM language result:", result.content);
  return result.content;
}

export async function generateLlmReply(dto: GenerateLlmReplyDto) {
  const chain = getResponseChain();
  if (!chain) {
    return null;
  } 

  try {
    const detectedLang = await detectLanguageWithLLM(dto);
    const reply = await chain.invoke({ ...dto, detectedLang });
    if (!reply) {
      return null;
    }

    return reply.trim();
  } catch (error) {
    console.error("Gemini request failed", error);
    return null;
  }
}

function getResponseChain() {
  if (responseChain) {
    return responseChain;
  }

  const llm = getLLM();
  if (!llm) {
    return null;
  }

  responseChain = buildResponseChain(llm);
  return responseChain;
}

function buildResponseChain(llm: ChatGoogleGenerativeAI) {
  const retrieveContext = RunnableLambda.from(async (input: GenerateLlmReplyDto) => {
    try {
      return await retrieveRelevantKnowledge(input.text);
    } catch (error) {
      console.error("Knowledge retrieval failed", error);
      return [];
    }
  });

  const retrieveHistory = RunnableLambda.from(async (input: GenerateLlmReplyDto) => {
    try {
      return await getRecentMessagesForLlm(input.chatId);
    } catch (error) {
      console.error("History retrieval failed", error);
      return [];
    }
  });

  const formatDocuments = RunnableLambda.from((documents: Document[]) => {
    if (!Array.isArray(documents) || documents.length === 0) {
      return "";
    }

    return documents.map((doc) => doc.pageContent).join("\n---\n");
  });

  const formatHistory = RunnableLambda.from(
    (messages: SimpleMessageDto[]) => {
      if (!Array.isArray(messages) || messages.length === 0) {
        return "";
      }

      return messages
        .map((message) => {
          const speaker = message.role === "agent" ? "Agent" : "User";
          return `${speaker}: ${message.content}`;
        })
        .join("\n");
    },
  );

  const promptTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a technical support agent from a data analytics team.
      Use the user’s question and the knowledge base context to give clear, concise answers.
      Vary your phrasing and avoid repeating earlier sentences.
      If unsure, reply politely with a variation of “I will check and get back.” For highly technical issues, say the engineer will follow up (with varied wording).
      Respond in the language matching "{detectedLang}" (ISO 639-3). 
      If "{detectedLang}" is "und", detect the language from the user's current message.
      Chat history is for context only and not for language detection.
      Answering rules:
      - Prioritize knowledge base information when relevant.
      - If the knowledge base lacks the answer, use chat history if it helps.
      - If both lack the answer, fall back to a polite “will check and get back” style reply.
      Prefer periods over exclamation marks and avoid emojis. Only reply to greetings when the user greets.

      Chat History:
      {history}

      Context:
      {context}
      `,
    ],
    ["user", "User message: {text}"],
  ]);

  return RunnablePassthrough.assign({
    context: retrieveContext.pipe(formatDocuments),
    history: retrieveHistory.pipe(formatHistory),
  })
    .pipe(promptTemplate)
    .pipe(llm)
    .pipe(new StringOutputParser());
}

function getLLM() {
  if (llmInstance) {
    return llmInstance;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_API_KEY in environment");
    return null;
  }

  llmInstance = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL,
    apiKey,
  });

  return llmInstance;
}