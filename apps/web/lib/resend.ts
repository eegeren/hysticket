import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing");
    return;
  }

  const { to, from, subject, text } = params;

  try {
    const result = await resend.emails.send({
      to,
      from,
      subject,
      text,
    });

    // Resend SDK bazı durumlarda { error } döner, bazı durumlarda direkt result döner
    // Bu loglar build'i etkilemez, runtime debug için
    if ((result as any)?.error) {
      console.error("Resend send failed:", (result as any).error);
    } else {
      console.log("Resend sent OK");
    }
  } catch (e) {
    console.error("Resend exception:", e);
  }
}