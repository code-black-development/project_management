import nodemailer from "nodemailer";

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
  try {
    await transporter.sendMail({
      from: '"codeflow from codeblack digital" <info@codeblack.digital>',
      to,
      subject,
      html,
    });

    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Failed to send email to:", to, error);
    throw new Error(
      `Failed to send invitation email: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function generateEmailTemplate(
  verificationLink: string,
  invitorName: string
) {
  try {
    console.log("verificationLink:", verificationLink);
    console.log("invitorName:", invitorName);
    // Get the base URL for the application
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const templateUrl = `${baseUrl}/email-templates/invite.html`;

    console.log("Fetching email template from:", templateUrl);

    // Fetch the template from the public folder
    const response = await fetch(templateUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch email template: ${response.status} ${response.statusText}`
      );
    }

    let emailHtml = await response.text();

    // Replace placeholders with actual values
    emailHtml = emailHtml
      .replace(/{{verificationLink}}/g, verificationLink)
      .replace(/{{invitorName}}/g, invitorName);

    return emailHtml;
  } catch (error) {
    console.error("Error generating email template:", error);

    // Fallback to a simple inline template if fetching fails
    console.log("Using fallback inline email template");

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background: #007bff; color: white; text-align: center; padding: 10px 0; }
            .content { padding: 20px; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to CodeFlow Pro!</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>
                You have been invited to join a workspace in CodeFlow Pro by
                ${invitorName}. We are excited to have you on board. Click the button
                below to verify your email:
              </p>
              <p>
                <a
                  href="${verificationLink}"
                  style="
                    display: inline-block;
                    padding: 10px 15px;
                    background: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                  "
                >Verify Email</a>
              </p>
            </div>
            <div class="footer">
              <p>If you don't know this person, you can ignore this email.</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export function generateInviteLink(code: string) {
  return `${process.env.INVITE_EMAIL_ADDRESS}?inviteCode=${code}`;
}

export async function generateExistingUserWelcomeTemplate(
  workspaceName: string,
  inviterName: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to ${workspaceName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${workspaceName}!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h2 style="color: #667eea; margin-top: 0;">You've been added to a workspace</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Good news! <strong>${inviterName}</strong> has added you to the <strong>${workspaceName}</strong> workspace.
            </p>
            <p style="font-size: 16px; margin-bottom: 25px;">
              You can now collaborate on projects and manage tasks together with your team.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/sign-in" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Sign In to Access Workspace
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              If you have any questions, feel free to reach out to ${inviterName} or your team administrator.
            </p>
          </div>
        </body>
      </html>
    `;
  } catch (error) {
    console.error("Error generating existing user welcome template:", error);
    return `
      <p>Welcome to ${workspaceName}!</p>
      <p>${inviterName} has added you to the workspace.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in">Sign in to access your workspace</a></p>
    `;
  }
}
