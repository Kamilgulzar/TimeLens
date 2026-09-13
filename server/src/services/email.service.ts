import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function verificationCodeHtml(code: string, firstName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#080A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="440" cellpadding="0" cellspacing="0" style="background-color:#111318;border-radius:16px;border:1px solid #262B36;padding:40px;">
              <tr>
                <td>
                  <h1 style="color:#F5F7FA;font-size:24px;font-weight:700;margin:0 0 8px 0;letter-spacing:-0.03em;">
                    Verify your email
                  </h1>
                  <p style="color:#8B919E;font-size:15px;line-height:1.6;margin:0 0 32px 0;">
                    Hi ${firstName}, here's your verification code:
                  </p>
                  <div style="background-color:#1A1D24;border:1px solid #2A2D35;border-radius:12px;padding:20px;text-align:center;margin:0 0 32px 0;">
                    <span style="color:#F5F7FA;font-size:32px;font-weight:700;letter-spacing:8px;font-family:monospace;">
                      ${code}
                    </span>
                  </div>
                  <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0 0 8px 0;">
                    This code expires in 15 minutes. If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function passwordResetHtml(code: string, firstName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#080A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="440" cellpadding="0" cellspacing="0" style="background-color:#111318;border-radius:16px;border:1px solid #262B36;padding:40px;">
              <tr>
                <td>
                  <h1 style="color:#F5F7FA;font-size:24px;font-weight:700;margin:0 0 8px 0;letter-spacing:-0.03em;">
                    Reset your password
                  </h1>
                  <p style="color:#8B919E;font-size:15px;line-height:1.6;margin:0 0 32px 0;">
                    Hi ${firstName}, here's your password reset code:
                  </p>
                  <div style="background-color:#1A1D24;border:1px solid #2A2D35;border-radius:12px;padding:20px;text-align:center;margin:0 0 32px 0;">
                    <span style="color:#F5F7FA;font-size:32px;font-weight:700;letter-spacing:8px;font-family:monospace;">
                      ${code}
                    </span>
                  </div>
                  <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0 0 8px 0;">
                    This code expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function getTransporter(): Promise<Transporter | null> {
  if (transporter) return transporter;

  if (!env.smtpUser || !env.smtpPass) return null;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

export const emailService = {
  async sendVerificationCode(
    email: string,
    code: string,
    firstName: string
  ): Promise<void> {
    const html = verificationCodeHtml(code, firstName);
    const subject = "Verify your TimeLens account";

    try {
      const transport = await getTransporter();
      if (transport) {
        await transport.sendMail({
          from: env.smtpUser,
          to: email,
          subject,
          html,
        });
        console.log(`[Email] Verification code sent to ${email}`);
        return;
      }
    } catch (err) {
      console.error("[Email] Failed to send verification code:", err);
    }

    console.log(`[Email] Verification code for ${email}: ${code}`);
  },

  async sendPasswordResetCode(
    email: string,
    code: string,
    firstName: string
  ): Promise<void> {
    const html = passwordResetHtml(code, firstName);
    const subject = "Reset your TimeLens password";

    try {
      const transport = await getTransporter();
      if (transport) {
        await transport.sendMail({
          from: env.smtpUser,
          to: email,
          subject,
          html,
        });
        console.log(`[Email] Password reset code sent to ${email}`);
        return;
      }
    } catch (err) {
      console.error("[Email] Failed to send password reset code:", err);
    }

    console.log(`[Email] Password reset code for ${email}: ${code}`);
  },
};
