import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailLogDocument = EmailLog & Document;

@Schema({ timestamps: true })
export class EmailLog {
  @Prop({ required: true, index: true })
  recipient_email: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['success', 'failed'] })
  status: string;

  @Prop()
  error_message?: string;

  @Prop({ default: Date.now })
  sent_at: Date;
}

export const EmailLogSchema = SchemaFactory.createForClass(EmailLog);
