import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly mailFrom: string;
  private readonly appBaseUrl: string;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: false,
      ignoreTLS: true,
    });
    this.mailFrom = config.getOrThrow<string>('MAIL_FROM');
    this.appBaseUrl = config
      .getOrThrow<string>('APP_BASE_URL')
      .replace(/\/$/, '');
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }

  async sendInvitation(
    email: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const link = `${this.appBaseUrl}/register?token=${rawToken}`;
    const expiresOn = expiresAt.toUTCString();

    const text = [
      `You've been invited to join the Task Management Platform.`,
      ``,
      `Open this link to set your password and finish creating your account:`,
      link,
      ``,
      `This invitation expires on ${expiresOn}.`,
      `If you weren't expecting this, you can safely ignore the email.`,
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to: email,
        subject: `You're invited to Task Management Platform`,
        text,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send invitation email to ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
