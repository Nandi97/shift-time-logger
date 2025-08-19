import nodemailer from 'nodemailer';

interface MailerServiceProps {
  toEmail: string;
  subject: string;
  htmlContent: string;
  optText?: any;
  attachments?: any[];
}
//-----------------------------------------------------------------------------
export const sendMail = async ({
  toEmail,
  subject,
  htmlContent,
  optText,
  attachments
}: MailerServiceProps) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  var options = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: subject,
    text: optText,
    attachments: attachments,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(options);
    return true;
  } catch (error: any) {
    console.error('Email Error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
};
