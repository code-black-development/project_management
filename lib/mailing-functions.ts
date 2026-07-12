import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const isProductionLike =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL === "1";

export function isEmailDeliveryConfigured() {
  return !!resend;
}

export function ensureEmailDeliveryAvailable() {
  if (!resend && isProductionLike) {
    throw new Error("RESEND_API_KEY is not configured");
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    if (isProductionLike) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // In development without a Resend key, log the email instead of sending
    console.log(`[EMAIL - no RESEND_API_KEY set]`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body preview: ${html.slice(0, 200).replace(/<[^>]+>/g, "")}...`);
    return;
  }

  const { error } = await resend.emails.send({
    from: "fasta.work <noreply@fasta.work>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email to:", to, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function generateEmailTemplate(
  verificationLink: string,
  invitorName: string
) {
  try {
    // Get the base URL for the application
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const templateUrl = `${baseUrl}/email-templates/invite.html`;

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
              <h2>Welcome to fasta.work!</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>
                You have been invited to join a workspace in fasta.work by
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

export function generateVerificationEmailTemplate(verifyLink: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Verify your email</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Verify your email</h1>
        </div>
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #3B82F6;">
          <p style="font-size: 16px;">Hi ${userName || "there"},</p>
          <p style="font-size: 16px;">Thanks for signing up to fasta.work. Please verify your email address to get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify email address
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          <p style="color: #6c757d; font-size: 14px;">Or copy this link: ${verifyLink}</p>
        </div>
      </body>
    </html>
  `;
}

export function generateFrozenWorkspaceEmailTemplate(
  workspaceNames: string[],
  deletionDate: string,
  upgradeLink: string
) {
  const list = workspaceNames.map((n) => `<li>${n}</li>`).join("");
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Workspace frozen</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Workspace frozen</h1>
        </div>
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="font-size: 16px;">The following workspace(s) have been frozen due to a plan downgrade:</p>
          <ul>${list}</ul>
          <p style="font-size: 16px;">These workspaces are <strong>read-only</strong> and will be <strong>permanently deleted on ${deletionDate}</strong>.</p>
          <p style="font-size: 16px;">To restore them, upgrade your plan before the deletion date.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${upgradeLink}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Upgrade plan
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateInviteLink(code: string) {
  return `${process.env.INVITE_EMAIL_ADDRESS}?inviteCode=${code}`;
}

export async function generateExistingUserWelcomeTemplate(
  workspaceName: string,
  inviterName: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

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
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-in">Sign in to access your workspace</a></p>
    `;
  }
}

export async function generateTaskAssignmentEmailTemplate(
  taskName: string,
  assignerName: string,
  taskLink: string,
  projectName: string
) {
  try {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Task Assigned: ${taskName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Task Assigned</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h2 style="color: #667eea; margin-top: 0;">You have a new task assignment</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              The task <strong>"${taskName}"</strong> has been assigned to you by <strong>${assignerName}</strong> in the <strong>${projectName}</strong> project.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
              <h3 style="margin-top: 0; color: #495057;">Task Details</h3>
              <p style="margin: 5px 0;"><strong>Task:</strong> ${taskName}</p>
              <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
              <p style="margin: 5px 0;"><strong>Assigned by:</strong> ${assignerName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${taskLink}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Task
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              You can view and manage this task by clicking the button above or visiting your dashboard.
            </p>
          </div>
        </body>
      </html>
    `;
  } catch (error) {
    console.error("Error generating task assignment email template:", error);
    return `
      <h2>Task Assigned</h2>
      <p>The task "${taskName}" has been assigned to you by ${assignerName} in the ${projectName} project.</p>
      <p><a href="${taskLink}">View Task</a></p>
    `;
  }
}

export async function sendTaskAssignmentNotification(
  assigneeEmail: string,
  assigneeName: string,
  taskName: string,
  taskId: string,
  workspaceId: string,
  assignerName: string,
  projectName: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const taskLink = `${baseUrl}/workspaces/${workspaceId}/tasks/${taskId}`;

    const emailHtml = await generateTaskAssignmentEmailTemplate(
      taskName,
      assignerName,
      taskLink,
      projectName
    );

    await sendEmail(assigneeEmail, `Task Assigned: ${taskName}`, emailHtml);
  } catch (error) {
    console.error("Failed to send task assignment notification:", error);
    // Don't throw the error to prevent task creation/update from failing
  }
}

export async function generatePasswordResetEmailTemplate(
  resetLink: string,
  userName: string
) {
  try {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea;">
            <h2 style="color: #667eea; margin-top: 0;">Password Reset Request</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello ${userName},
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your fasta.work account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. This link will expire in 1 hour.
            </p>
            <p style="color: #6c757d; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser: ${resetLink}
            </p>
          </div>
        </body>
      </html>
    `;
  } catch (error) {
    console.error("Error generating password reset email template:", error);
    return `
      <h2>Reset Your Password</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email. This link will expire in 1 hour.</p>
    `;
  }
}
