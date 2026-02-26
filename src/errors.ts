export class WhatsAppError extends Error {
    status?: number;
    metaCode?: number;
  
    constructor(message: string, status?: number, metaCode?: number) {
      super(message);
      this.status = status;
      this.metaCode = metaCode;
    }
  }