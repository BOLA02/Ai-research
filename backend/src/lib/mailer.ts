import { env } from "../config/env";

export type Mail = { to: string; subject: string; text: string; html: string };
export type Mailer = (mail: Mail) => Promise<void>;

/**
 * Sends mail through Resend's HTTP API. With no key set, the message is printed
 * to the log so the flow can be tried locally. In production a missing key is
 * logged as an error and nothing is sent.
 */
export const sendMail: Mailer = async (mail) => {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") console.error("RESEND_API_KEY is not set, so the email to", mail.to, "was not sent");
    else console.log(`\n[mail] To: ${mail.to}\n[mail] Subject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
};
