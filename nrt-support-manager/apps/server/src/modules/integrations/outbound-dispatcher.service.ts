import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OutboundDispatcherService {
  private readonly logger = new Logger(OutboundDispatcherService.name);

  async sendWhatsApp(to: string, body: string): Promise<boolean> {
    const formattedTo = to.startsWith('+') ? to : `+${to}`;

    // 1. Check for Meta Cloud API credentials
    if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID) {
      try {
        const url = `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedTo,
            type: 'text',
            text: { preview_url: false, body },
          }),
        });
        const data = await res.json();
        this.logger.log(`Meta WhatsApp Cloud API response: ${JSON.stringify(data)}`);
        return res.ok;
      } catch (err) {
        this.logger.error(`Failed to send WhatsApp via Meta API`, err);
      }
    }

    // 2. Check for Twilio credentials
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${formattedTo}`,
            From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            Body: body,
          }),
        });
        const data = await res.json();
        this.logger.log(`Twilio API response: ${JSON.stringify(data)}`);
        return res.ok;
      } catch (err) {
        this.logger.error(`Failed to send WhatsApp via Twilio API`, err);
      }
    }

    this.logger.warn(`No WhatsApp credentials set in env. Simulated delivery to ${formattedTo}: "${body}"`);
    return false;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Check for Resend credentials
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject,
            html: `<p style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #09090b;">${body.replace(/\n/g, '<br/>')}</p>`,
          }),
        });
        const data = await res.json();
        this.logger.log(`Resend API response: ${JSON.stringify(data)}`);
        return res.ok;
      } catch (err) {
        this.logger.error(`Failed to send Email via Resend API`, err);
      }
    }

    this.logger.warn(`No Email credentials set in env. Simulated delivery to ${to} [Subject: "${subject}"]: "${body}"`);
    return false;
  }
}
