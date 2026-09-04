import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly frontendUrl: string;
  private readonly fromAddress: string;
  private readonly resendApiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://platform-web-five.vercel.app';
    this.fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS') ?? 'Platform LMS <noreply@globalmathematics.online>';
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = host && port && user && pass
      ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      : null;
  }

  private getFromAddress(): string {
    return this.fromAddress;
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const from = this.getFromAddress();
    const logoUrl = 'https://globalmathematics.online/logo.png';
    const subject = `${otp} هو رمز التحقق الخاص بك لـ Global Math`;
    const text = `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${logoUrl}" alt="Global Math Logo" style="width: 64px; height: 64px; margin-bottom: 12px; object-fit: contain;" />
          <h2 style="color: #1e293b; margin: 0; font-size: 22px; font-weight: 700;">Global Math</h2>
        </div>
        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 8px;">مرحباً بك،</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">استخدم رمز التحقق التالي لإكمال عملية تسجيل الدخول إلى حسابك في منصة <strong>Global Math</strong>:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 24px 0; border-radius: 8px;">${otp}</div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">هذا الرمز صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بصفة آمنة.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© Global Math Platform</p>
      </div>
    `;

    try {
      if (this.resendApiKey) {
        await this.sendWithResend({ from, to: email, subject, text, html });
      } else if (this.transporter) {
        await this.transporter.sendMail({ from, to: email, subject, text, html });
      } else {
        throw new ServiceUnavailableException('Email delivery is not configured');
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendPasswordResetOtpEmail(email: string, otp: string): Promise<void> {
    const from = this.getFromAddress();
    const subject = 'Your Platform LMS password reset code';
    const text = `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.`;
    const html = `<p>Your Platform LMS password reset code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p><p>This code expires in 10 minutes.</p>`;
    try {
      if (this.resendApiKey) await this.sendWithResend({ from, to: email, subject, text, html });
      else if (this.transporter) await this.transporter.sendMail({ from, to: email, subject, text, html });
      else throw new ServiceUnavailableException('Email delivery is not configured');
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to ${email}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }

  async sendEmailVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.transporter && !this.resendApiKey) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }

    const verificationUrl = `${this.frontendUrl.replace(/\/+$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
    const from = this.getFromAddress();

    try {
      if (this.resendApiKey) {
        await this.sendWithResend({
          from,
          to: email,
          subject: 'Verify your Platform LMS email',
          text: `Verify your email using this link: ${verificationUrl}\n\nThis link expires in 24 hours and can be used once.`,
          html: `<p>Verify your Platform LMS email:</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours and can be used once.</p>`,
        });
      } else if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: 'Verify your Platform LMS email',
          text: `Verify your email using this link: ${verificationUrl}\n\nThis link expires in 24 hours and can be used once.`,
          html: `<p>Verify your Platform LMS email:</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours and can be used once.</p>`,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.transporter && !this.resendApiKey) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }

    const resetUrl = `${this.frontendUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    const from = this.getFromAddress();

    try {
      if (this.resendApiKey) {
        await this.sendWithResend({
          from,
          to: email,
          subject: 'Reset your Platform LMS password',
          text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 30 minutes and can be used once.`,
          html: `<p>Reset your Platform LMS password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p>`,
        });
      } else if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: 'Reset your Platform LMS password',
          text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 30 minutes and can be used once.`,
          html: `<p>Reset your Platform LMS password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p>`,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendWithResend(data: { from: string; to: string; subject: string; text: string; html?: string }): Promise<void> {
    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: data.from,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message ?? `Resend API request failed with status ${response.status}`);
    }
  }
}
