import { getWorkspaceInvite } from "@/lib/dbService/workspace-invites";
import prisma from "@/prisma/prisma";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import bcrypt from "bcrypt";
import { uploadToS3, deleteManyFromS3, extractS3KeyFromUrl } from "@/lib/s3";
import {
  sendEmail,
  generatePasswordResetEmailTemplate,
  generateVerificationEmailTemplate,
} from "@/lib/mailing-functions";
import { randomBytes } from "crypto";

import { z } from "zod";

const app = new Hono()
  .post(
    "/forgot-password",
    zValidator(
      "json",
      z.object({
        email: z.string().email(),
      })
    ),
    async (c) => {
      const { email } = c.req.valid("json");

      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Always return success message for security (don't reveal if email exists)
        const successMessage =
          "Thank you, if your email is in the system we will email you a reset link. Please check your email account.";

        if (!user) {
          return c.json({ message: successMessage });
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save reset token to database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry,
          },
        });

        // Generate reset link
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        // Send email
        const emailHtml = await generatePasswordResetEmailTemplate(
          resetLink,
          user.name || user.email
        );
        await sendEmail(user.email, "Reset Your Password", emailHtml);

        return c.json({ message: successMessage });
      } catch (error) {
        console.error("Forgot password error:", error);
        return c.json({
          message:
            "Thank you, if your email is in the system we will email you a reset link. Please check your email account.",
        });
      }
    }
  )
  .post(
    "/reset-password",
    zValidator(
      "json",
      z.object({
        token: z.string(),
        password: z.string().min(8),
      })
    ),
    async (c) => {
      const { token, password } = c.req.valid("json");

      try {
        // Find user with valid reset token
        const user = await prisma.user.findFirst({
          where: {
            resetToken: token,
            resetTokenExpiry: {
              gt: new Date(),
            },
          },
        });

        if (!user) {
          return c.json({ error: "Invalid or expired reset token" }, 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and clear reset token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
          },
        });

        return c.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Reset password error:", error);
        return c.json({ error: "Failed to reset password" }, 500);
      }
    }
  )
  .post(
    "/register",
    zValidator(
      "json",
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
        inviteCode: z.string().optional(),
      })
    ),
    async (c) => {
      const { email, password, name, inviteCode } = c.req.valid("json");

      // If invite code provided, validate it first
      let invitee: Awaited<ReturnType<typeof getWorkspaceInvite>> = null;
      if (inviteCode) {
        invitee = await getWorkspaceInvite(inviteCode);
        if (!invitee) {
          return c.json({ error: "Invalid invite code" }, 400);
        }
        // Invite email must match
        if (invitee.inviteeEmail.toLowerCase() !== email.toLowerCase()) {
          return c.json({ error: "Email does not match invite" }, 400);
        }
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return c.json({ error: "An account with this email already exists" }, 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Look up Starter plan
      const starterPlan = await prisma.plan.findUnique({ where: { name: "Starter" } });

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name ?? null,
          },
        });

        if (invitee && inviteCode) {
          await tx.member.create({
            data: {
              userId: newUser.id,
              workspaceId: invitee.workspaceId,
            },
          });
          await tx.workspaceInvites.delete({
            where: { code: inviteCode },
          });
        }

        return newUser;
      });

      // Create subscription (non-fatal)
      if (starterPlan) {
        try {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              planId: starterPlan.id,
            },
          });
        } catch (err) {
          console.error("Failed to create subscription for user:", user.id, err);
        }
      } else {
        console.warn("Starter plan not found — skipping subscription creation");
      }

      // Send verification email (non-fatal)
      try {
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
          data: {
            identifier: email,
            token,
            expires,
          },
        });

        const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";
        const verifyLink = `${appOrigin}/api/auth/verify-email?token=${token}`;
        const emailHtml = generateVerificationEmailTemplate(verifyLink, name ?? email);
        await sendEmail(email, "Verify your email — fasta.work", emailHtml);
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }

      return c.json({ data: { id: user.id, email: user.email } });
    }
  )
  .patch("/profile", async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const formData = await c.req.formData();
      const name = formData.get("name") as string;
      const imageFile = formData.get("image") as File | null;

      if (!name || name.trim().length === 0) {
        return c.json({ error: "Name is required" }, 400);
      }

      // Get current user data to check for existing image
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      let imageUrl: string | null = currentUser?.image || null;
      let uploadedImageKey: string | null = null;
      const oldImageKey = currentUser?.image
        ? extractS3KeyFromUrl(currentUser.image)
        : null;

      // Handle image upload/update
      if (imageFile && imageFile.size > 0) {
        // Upload new image to S3
        const uploadResult = await uploadToS3(
          imageFile,
          "profile-images",
          imageFile.name
        );
        imageUrl = uploadResult.key; // Store S3 key instead of full URL
        uploadedImageKey = uploadResult.key;
      }

      // Handle image removal (when empty string is sent)
      const imageValue = formData.get("image");
      if (imageValue === "" && currentUser?.image) {
        imageUrl = null;
      }

      let user;
      try {
        user = await prisma.user.update({
          where: { id: userId },
          data: {
            name: name.trim(),
            ...(imageFile || imageValue === "" ? { image: imageUrl } : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
      } catch (error) {
        if (uploadedImageKey) {
          await deleteManyFromS3(
            [uploadedImageKey],
            "uploaded profile image rollback"
          );
        }
        throw error;
      }

      const newImageKey = imageUrl ? extractS3KeyFromUrl(imageUrl) : null;
      if (oldImageKey && oldImageKey !== newImageKey) {
        await deleteManyFromS3([oldImageKey], "old profile image");
      }

      return c.json({ data: user });
    } catch (error) {
      console.error("Failed to update user profile:", error);
      return c.json({ error: "Failed to update profile" }, 500);
    }
  });

export default app;
