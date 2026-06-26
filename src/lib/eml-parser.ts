import { simpleParser, ParsedMail, Attachment } from 'mailparser';

export interface ParsedResumeEmail {
  from: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    buffer: Buffer;
  }[];
}

/**
 * Parse an .eml file buffer and extract email content + attachments
 */
export async function parseEmlFile(buffer: Buffer): Promise<ParsedResumeEmail> {
  const parsed: ParsedMail = await simpleParser(buffer);

  const attachments = (parsed.attachments || []).map((att: Attachment) => ({
    filename: att.filename || 'unknown',
    contentType: att.contentType || 'application/octet-stream',
    size: att.size || 0,
    buffer: att.content instanceof Buffer ? att.content : Buffer.from(att.content as string),
  }));

  const toText = Array.isArray(parsed.to)
    ? parsed.to.map((t) => t.text || '').join(', ')
    : (parsed.to?.text || '');

  return {
    from: parsed.from?.text || '',
    to: toText.replace(/\n/g, ', '),
    subject: parsed.subject || '(无主题)',
    date: parsed.date?.toISOString() || '',
    bodyText: parsed.text || '',
    bodyHtml: parsed.html || '',
    attachments,
  };
}

/**
 * Check if an email is likely a resume submission
 */
export function isResumeEmail(email: ParsedResumeEmail): boolean {
  const keywords = [
    '简历', '应聘', '求职', '申请', 'resume', 'CV', 'curriculum vitae',
    '招聘', '岗位', '职位', 'job', 'apply', 'application',
  ];
  const combined = `${email.subject} ${email.bodyText.substring(0, 500)}`.toLowerCase();
  return keywords.some((kw) => combined.includes(kw.toLowerCase()));
}

/**
 * Check if an attachment is a resume file
 */
export function isResumeAttachment(filename: string): boolean {
  const resumeExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
  const lower = filename.toLowerCase();
  return resumeExtensions.some((ext) => lower.endsWith(ext));
}

/**
 * Extract text content from resume attachments (basic support)
 */
export function extractAttachmentText(attachment: { filename: string; contentType: string; size: number; buffer: Buffer }): string {
  const lower = attachment.filename.toLowerCase();

  if (lower.endsWith('.txt') || lower.endsWith('.rtf')) {
    return attachment.buffer.toString('utf-8');
  }

  // For PDF, DOC, DOCX - return placeholder indicating binary format
  // Full parsing would require pdf-parse, mammoth etc.
  if (lower.endsWith('.pdf')) {
    return `[PDF 附件: ${attachment.filename}, 大小: ${(attachment.size / 1024).toFixed(1)}KB]`;
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    return `[Word 附件: ${attachment.filename}, 大小: ${(attachment.size / 1024).toFixed(1)}KB]`;
  }

  return `[附件: ${attachment.filename}]`;
}
