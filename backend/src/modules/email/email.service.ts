import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as sanitizeHtml from 'sanitize-html';
import * as fs from 'fs';
import * as path from 'path';
import { EmailLog, EmailLogDocument } from './schemas/email-log.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(EmailLog.name) private emailLogModel: Model<EmailLogDocument>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<number>('SMTP_PORT')),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendBulkEmail(emails: string[], subject: string, content: string, resumeFilename?: string) {
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    });

    const results = await Promise.allSettled(
      emails.map((email) => this.sendSingleEmail(email, subject, sanitizedContent, resumeFilename)),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Bulk email process completed. Success: ${successCount}, Failures: ${failureCount}`);

    return {
      success: true,
      message: 'Emails processed successfully',
      total: emails.length,
      successCount,
      failureCount,
    };
  }

  private async sendSingleEmail(email: string, subject: string, content: string, resumeFilename?: string) {
    try {
      const attachments: any[] = [];
      if (resumeFilename) {
        const filePath = path.join(process.cwd(), 'resumes', resumeFilename);
        if (fs.existsSync(filePath)) {
          attachments.push({
            filename: resumeFilename,
            path: filePath,
          });
        }
      }

      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('APP_NAME') || 'Bulk Mailer'}" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: email,
        subject,
        html: content,
        attachments,
      });

      await this.logEmail(email, subject, content, 'success');
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      await this.logEmail(email, subject, content, 'failed', error.message);
      throw error;
    }
  }

  private async logEmail(
    recipient_email: string,
    subject: string,
    content: string,
    status: 'success' | 'failed',
    error_message?: string,
  ) {
    const log = new this.emailLogModel({
      recipient_email,
      subject,
      content,
      status,
      error_message,
      sent_at: new Date(),
    });
    return log.save();
  }

  async getEmailLogs(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query = search ? { recipient_email: new RegExp(search, 'i') } : {};

    const [logs, total] = await Promise.all([
      this.emailLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.emailLogModel.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getResumes() {
    const resumesPath = path.join(process.cwd(), 'resumes');
    this.logger.log(`Checking for resumes in: ${resumesPath}`);
    if (!fs.existsSync(resumesPath)) {
      this.logger.warn(`Resumes directory not found at: ${resumesPath}`);
      return [];
    }
    const files = fs.readdirSync(resumesPath).filter(file => file.endsWith('.pdf'));
    this.logger.log(`Found ${files.length} resumes`);
    return files;
  }
}
