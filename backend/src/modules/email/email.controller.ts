import { Controller, Post, Body, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-bulk')
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendBulk(@Body() sendBulkEmailDto: SendBulkEmailDto) {
    const { emails, subject, content, resumeFilename } = sendBulkEmailDto;
    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    return this.emailService.sendBulkEmail(uniqueEmails, subject, content, resumeFilename);
  }

  @Get('resumes')
  async getResumes() {
    return this.emailService.getResumes();
  }

  @Get('logs')
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.emailService.getEmailLogs(parseInt(page), parseInt(limit), search);
  }
}
