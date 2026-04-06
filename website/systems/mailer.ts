import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

function from() {
  return process.env.SMTP_FROM || 'Crept <no-reply@crept.local>';
}

export async function sendWelcomeEmail(to: string, username: string) {
  await transporter.sendMail({ from: from(), to, subject: 'Welcome to Crept', text: `Welcome ${username}! Your account is ready.` });
}

export async function sendExpiryWarning(to: string, expiry: string) {
  await transporter.sendMail({ from: from(), to, subject: 'License expiry warning', text: `Your license expires on ${expiry}.` });
}

export async function sendHWIDResetApproved(to: string) {
  await transporter.sendMail({ from: from(), to, subject: 'HWID reset approved', text: 'Your HWID reset request has been approved.' });
}

export async function sendTicketReply(to: string, subject: string, body: string) {
  await transporter.sendMail({ from: from(), to, subject: `Ticket update: ${subject}`, text: body });
}
