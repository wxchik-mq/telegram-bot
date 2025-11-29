export interface KnowledgeBaseDao {
  id?: number;
  text: string;
  embedding: number[];
  metadata: any;
  chunkIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentDao {
  documentType: string;
  documentTitle?: string | null;
  documentMetadata?: any;
  chunks: KnowledgeBaseDao[];
}