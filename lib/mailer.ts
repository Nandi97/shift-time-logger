import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import type { ReactElement } from 'react';

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST!, // e.g., smtp.forwardemail.net
  port: Number(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE === 'true', // true for 465
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  }
});

export async function sendMail({
  to,
  subject,
  reactBody,
  attachments = []
}: {
  to: string | string[];
  subject: string;
  reactBody: ReactElement;
  attachments?: { filename: string; content: string | Buffer }[];
}) {
  const html = await render(reactBody);

  const info = await smtpTransport.sendMail({
    from: process.env.REPORT_SENDER_EMAIL!,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html,
    attachments
  });

  return info.messageId;
}
