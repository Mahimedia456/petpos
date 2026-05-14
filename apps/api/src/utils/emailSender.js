import nodemailer from "nodemailer";
import { otpEmailTemplate } from "./emailTemplates.js";

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  };
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export async function sendOtpEmail({ to, otp }) {
  if (!to || !otp) {
    throw new Error("Email recipient and OTP are required.");
  }

  if (!isEmailConfigured()) {
    console.log("SMTP is not configured. OTP email skipped.");
    console.log("Reset email:", to);
    console.log("Reset OTP:", otp);

    return {
      skipped: true,
      message: "SMTP not configured. OTP printed in server logs.",
    };
  }

  const transporter = nodemailer.createTransport(getSmtpConfig());

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "Pet POS Admin <no-reply@petpos.local>";

  const appName = process.env.APP_NAME || "Pet POS Admin";

  const info = await transporter.sendMail({
    from,
    to,
    subject: `${appName} Password Reset OTP`,
    html: otpEmailTemplate({
      otp,
      appName,
    }),
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}