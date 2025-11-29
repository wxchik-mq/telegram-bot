export class KnowledgeBaseNotFoundError extends Error {
  constructor(id: number) {
    super(`Knowledge base entry ${id} not found`);
    this.name = "KnowledgeBaseNotFoundError";
  }
}

export class KnowledgeBaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeBaseValidationError";
  }
}
