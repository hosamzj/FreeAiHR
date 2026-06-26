declare module 'mailparser' {
  import { Stream } from 'stream';

  export interface EmailAddress {
    name?: string;
    address?: string;
    text?: string;
  }

  export interface Attachment {
    filename?: string;
    contentType: string;
    content: Buffer | string;
    size: number;
    contentDisposition?: string;
    contentId?: string;
    checksum?: string;
  }

  export interface ParsedMail {
    from?: EmailAddress;
    to?: EmailAddress | EmailAddress[];
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    subject?: string;
    date?: Date;
    text?: string;
    html?: string;
    attachments?: Attachment[];
    headers?: Map<string, string | string[]>;
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    priority?: 'normal' | 'high' | 'low';
  }

  export interface SimpleParserOptions {
    skipHtmlToText?: boolean;
    skipTextToHtml?: boolean;
    skipTextLinks?: boolean;
    keepCidLinks?: boolean;
    keepDeliveryStatus?: boolean;
    IcalParser?: unknown;
  }

  export function simpleParser(
    source: Buffer | Stream | string,
    options?: SimpleParserOptions
  ): Promise<ParsedMail>;
}
