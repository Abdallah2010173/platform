import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = host && port && user && pass
      ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      : null;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.transporter) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new ServiceUnavailableException('Password reset URL is not configured');
    }

    const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    const from = this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER');

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your Platform LMS password',
      text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 30 minutes and can be used once.`,
      html: `<p>Reset your Platform LMS password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p>`,
    });
  }
}
