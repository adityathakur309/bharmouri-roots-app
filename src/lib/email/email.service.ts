import nodemailer from "nodemailer";
import { logger } from "@/lib/utils/logger";

export type EmailProvider = "smtp" | "resend" | "brevo" | "none";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: EmailProvider;
  id?: string;
  skipped?: boolean;
  error?: string;
}

function resolveProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (explicit === "smtp" || explicit === "resend" || explicit === "brevo") {
    return explicit;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "smtp";
  }
  if (process.env.EMAIL_API_KEY?.startsWith("re_")) return "resend";
  if (process.env.EMAIL_API_KEY) return "brevo";
  return "none";
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@bharmouriroots.in"
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return {
      ok: false,
      provider: "smtp",
      error: "SMTP is not fully configured (SMTP_HOST/USER/PASS)",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text || stripHtml(input.html),
    replyTo: input.replyTo,
  });

  return { ok: true, provider: "smtp", id: info.messageId };
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    return { ok: false, provider: "resend", error: "EMAIL_API_KEY missing" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text || stripHtml(input.html),
      reply_to: input.replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, provider: "resend", error: body || res.statusText };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, provider: "resend", id: data.id };
}

async function sendViaBrevo(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    return { ok: false, provider: "brevo", error: "EMAIL_API_KEY missing" };
  }

  const toList = (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({
    email,
  }));

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: getFromAddress() },
      to: toList,
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text || stripHtml(input.html),
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, provider: "brevo", error: body || res.statusText };
  }

  const data = (await res.json()) as { messageId?: string };
  return { ok: true, provider: "brevo", id: data.messageId };
}

/**
 * Reusable free-tier email sender.
 * Prefer SMTP when EMAIL_PROVIDER=smtp (project default choice).
 * Failures are logged and returned — never thrown to callers unless requested.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = resolveProvider();

  if (provider === "none") {
    logger.warn("Email skipped — no provider configured", {
      to: input.to,
      subject: input.subject,
    });
    return {
      ok: false,
      provider: "none",
      skipped: true,
      error: "Email provider not configured",
    };
  }

  try {
    let result: SendEmailResult;
    if (provider === "smtp") result = await sendViaSmtp(input);
    else if (provider === "resend") result = await sendViaResend(input);
    else result = await sendViaBrevo(input);

    if (!result.ok) {
      logger.error("Email send failed", {
        provider: result.provider,
        error: result.error,
        subject: input.subject,
      });
    } else {
      logger.info("Email sent", {
        provider: result.provider,
        id: result.id,
        subject: input.subject,
      });
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Email send crashed (swallowed)", {
      provider,
      error: message,
      subject: input.subject,
    });
    return { ok: false, provider, error: message };
  }
}

export const emailService = { sendEmail, resolveProvider, getFromAddress };
