import { resend } from "../config/email";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const EmailService = {
  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #101828; margin-bottom: 8px;">Verify your email</h2>
          <p style="color: #667085; margin-bottom: 24px;">
            Hi ${fullName}, thanks for signing up. Click the button below to verify your email address.
            This link expires in <strong>24 hours</strong>.
          </p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 24px;background:#2044FF;color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:600;">
            Verify email
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification email");
    }
  },

  async sendNotificationEmail(to: string, title: string, message: string): Promise<void> {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: title,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #101828; margin-bottom: 8px;">${title}</h2>
          <p style="color: #667085; margin-bottom: 24px;">${message}</p>
          <a href="${env.FRONTEND_URL}/dashboard/notifications"
             style="display:inline-block;padding:12px 24px;background:#2044FF;color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:600;">
            View in dashboard
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
            You are receiving this because you have an account on Tek247.
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error("Failed to send notification email:", error);
    }
  },

  async sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #101828; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #667085; margin-bottom: 24px;">
            Hi ${fullName}, we received a request to reset your password.
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#2044FF;color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:600;">
            Reset password
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  },
};

export default EmailService;
