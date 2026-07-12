export type EmailAddress = string;

export type SendEmailInput = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
};

export type SendEmailResult = {
  messageId: string;
  accepted: EmailAddress[];
  rejected: EmailAddress[];
};

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};
