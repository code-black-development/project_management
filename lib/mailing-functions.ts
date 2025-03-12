import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

if (!process.env.SMTP_HOST) {
  throw new Error("SMTP_HOST is not set");
}
if (!process.env.SMTP_USER) {
  throw new Error("SMTP_USER is not set");
}
if (!process.env.SMTP_PASS) {
  throw new Error("SMTP_PASS is not set");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: '"codeflow from codeblack digital" <info@codeblack.digital>',
    to,
    subject,
    html,
  });

  console.log("Email sent to:", to);
}

export function generateEmailTemplate(
  name: string,
  verificationLink: string,
  invitorName: string
) {
  const templatePath = path.join(
    process.cwd(),
    "features",
    "members",
    "_components",
    "invite-email-template.html"
  );
  let emailHtml = fs.readFileSync(templatePath, "utf8");

  emailHtml = emailHtml
    .replace(/{{name}}/g, name)
    .replace(/{{verificationLink}}/g, verificationLink)
    .replace(/{{invitorName}}/g, invitorName);

  return emailHtml;
}
