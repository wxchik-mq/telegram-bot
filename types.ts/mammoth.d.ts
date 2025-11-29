declare module "mammoth" {
  export interface ExtractRawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      styleId?: string;
    }>;
  }

  export interface ExtractRawTextOptions {
    path?: string;
    buffer?: Buffer | ArrayBuffer | Uint8Array;
    arrayBuffer?: ArrayBuffer;
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}
