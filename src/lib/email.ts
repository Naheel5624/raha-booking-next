import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Raha Convention Centre';
const TAGLINE = process.env.NEXT_PUBLIC_TAGLINE || 'Where moments become memories.';

interface EmailData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: string;
  blockedUntil: string;
}

export async function sendBookingConfirmation(data: EmailData): Promise<boolean> {
  if (!data.clientEmail) return true; // No email → skip silently

  const resendClient = getResend();
  if (!resendClient) {
    console.warn('Resend not configured — skipping email for', data.bookingId);
    return true; // Don't fail the booking if email isn't configured
  }

  const fromEmail = process.env.EMAIL_FROM || `Raha Convention Centre <noreply@resend.dev>`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f4f6f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#1B2A4A 0%,#2C3E6B 100%);padding:40px 30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">${COMPANY}</h1>
<p style="color:#C9A84C;margin:8px 0 0;font-size:14px;font-style:italic;">${TAGLINE}</p>
</td></tr>

<tr><td style="background:#E8F5E9;padding:20px 30px;text-align:center;">
<p style="color:#2E7D32;margin:0;font-size:18px;font-weight:600;">✓ Booking Confirmed!</p>
</td></tr>

<tr><td style="padding:30px;">
<p style="color:#424242;margin:0 0 20px;font-size:15px;">Dear <strong>${data.clientName}</strong>,</p>
<p style="color:#424242;margin:0 0 25px;font-size:15px;line-height:1.6;">Thank you for choosing ${COMPANY}. Your booking has been confirmed.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
<tr style="background:#f5f5f5;"><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;width:45%;font-size:14px;">Booking ID</td><td style="padding:12px 16px;color:#212121;font-size:14px;font-weight:600;">${data.bookingId}</td></tr>
<tr><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Event Name</td><td style="padding:12px 16px;color:#212121;font-size:14px;">${data.eventName}</td></tr>
<tr style="background:#f5f5f5;"><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Client Name</td><td style="padding:12px 16px;color:#212121;font-size:14px;">${data.clientName}</td></tr>
<tr><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Event Date</td><td style="padding:12px 16px;color:#212121;font-size:14px;">${data.eventDate}</td></tr>
<tr style="background:#f5f5f5;"><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Start Time</td><td style="padding:12px 16px;color:#212121;font-size:14px;">${data.startTime}</td></tr>
<tr><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">End Time</td><td style="padding:12px 16px;color:#212121;font-size:14px;">${data.endTime} (Buffer until ${data.blockedUntil})</td></tr>
<tr style="background:#E8EAF6;"><td style="padding:12px 16px;font-weight:700;color:#1B2A4A;font-size:14px;">Total Amount</td><td style="padding:12px 16px;color:#1B2A4A;font-size:16px;font-weight:700;">₹${data.totalAmount.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Amount Paid</td><td style="padding:12px 16px;color:#2E7D32;font-size:14px;font-weight:600;">₹${data.amountPaid.toLocaleString('en-IN')}</td></tr>
<tr style="background:#f5f5f5;"><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Balance Due</td><td style="padding:12px 16px;color:#B71C1C;font-size:14px;font-weight:600;">₹${data.balanceDue.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding:12px 16px;font-weight:600;color:#1B2A4A;font-size:14px;">Payment Status</td><td style="padding:12px 16px;font-size:14px;"><span style="display:inline-block;padding:3px 12px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;background:${data.paymentStatus === 'Paid' ? '#2E7D32' : data.paymentStatus === 'Partially Paid' ? '#F57F17' : '#B71C1C'};">${data.paymentStatus}</span></td></tr>
</table>

<p style="color:#757575;margin:25px 0 0;font-size:12px;">The hall has a 2-hour preparation buffer after your event.</p>
</td></tr>

<tr><td style="background:#1B2A4A;padding:25px 30px;text-align:center;">
<p style="color:#90A4AE;margin:0 0 5px;font-size:13px;">${COMPANY}</p>
<p style="color:#546E7A;margin:0;font-size:11px;">This is an automated confirmation. Please do not reply to this email.</p>
</td></tr>

</table></td></tr></table></body></html>`;

  try {
    await resendClient.emails.send({
      from: fromEmail,
      to: data.clientEmail,
      subject: `Booking Confirmation - ${data.bookingId} | ${COMPANY}`,
      html: htmlBody,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}
