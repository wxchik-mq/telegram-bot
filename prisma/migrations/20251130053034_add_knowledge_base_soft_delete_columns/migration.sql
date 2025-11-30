-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "knowledge_base" ADD COLUMN     "deletedAt" TIMESTAMP(3);
