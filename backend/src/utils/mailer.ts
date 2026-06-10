import nodemailer from "nodemailer";
import { config } from "../config/app.config";

export const isSmtpConfigured = () =>
  Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name?: string;
  resetUrl: string;
}) => {
  if (!isSmtpConfigured()) {
    console.log("[Mailer] SMTP not configured — skipping email delivery");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject: "Reset your Team Sync password",
      text: [
        `Hi ${name || "there"},`,
        "",
        "We received a request to reset your Team Sync password.",
        `Open this link to set a new password: ${resetUrl}`,
        "",
        "This link expires in 30 minutes. If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Reset your Team Sync password</h2>
        <p>Hi ${name || "there"},</p>
        <p>We received a request to reset your Team Sync password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;border-radius:8px;background:#111827;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700">
            Set new password
          </a>
        </p>
        <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
    });

    console.log(`[Mailer] Password reset email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] Failed to send password reset email to ${to}:`, error);
    throw error;
  }
};
