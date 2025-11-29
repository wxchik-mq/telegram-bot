import { prisma } from "../db/prisma";
import { Prisma } from "@prisma/client";

export async function deleteAllDocumentEntriesTest() {
   await prisma.document.deleteMany({});
   await deleteAllKnowledgeBaseEntriesTest();
}

export async function deleteAllKnowledgeBaseEntriesTest() {
    await prisma.knowledgeBase.deleteMany({});
}

export async function getDocumentById(id: number) {
    return prisma.document.findUnique({ where: { id } });
}