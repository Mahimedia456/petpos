import nodemailer from "nodemailer";
import { otpEmailTemplate } from "./emailTemplates.js";

function cleanValue(value) {
  return String(value || "").trim();
}

function getSmtpConfig() {
  const host = cleanValue(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = cleanValue(process.env.SMTP_USER);
  const pass = cleanValue(process.env.SMTP_PASS);

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
}

export function isEmailConfigured() {
  return Boolean(
    cleanValue(process.env.SMTP_HOST) &&
      cleanValue(process.env.SMTP_PORT) &&
      cleanValue(process.env.SMTP_USER) &&
      cleanValue(process.env.SMTP_PASS)
  );
}

export function getEmailConfigStatus() {
  return {
    configured: isEmailConfigured(),
    host: cleanValue(process.env.SMTP_HOST) || null,
    port: cleanValue(process.env.SMTP_PORT) || null,
    secure: cleanValue(process.env.SMTP_SECURE) || null,
    user: cleanValue(process.env.SMTP_USER)
      ? cleanValue(process.env.SMTP_USER).replace(/^(.{2}).+(@.+)$/, "$1***$2")
      : null,
    from: cleanValue(process.env.SMTP_FROM) || null,
  };
}

export async function sendOtpEmail({ to, otp }) {
  if (!to || !otp) {
    throw new Error("Email recipient and OTP are required.");
  }

  const configStatus = getEmailConfigStatus();

  console.log("Email config status:", configStatus);

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

  await transporter.verify();

  const appName = cleanValue(process.env.APP_NAME) || "Pet POS Admin";

  const from =
    cleanValue(process.env.SMTP_FROM) ||
    `${appName} <${cleanValue(process.env.SMTP_USER)}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject: `${appName} Password Reset OTP`,
    html: otpEmailTemplate({
      otp,
      appName,
    }),
  });

  console.log("OTP email sent:", {
    to,
    messageId: info.messageId,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}