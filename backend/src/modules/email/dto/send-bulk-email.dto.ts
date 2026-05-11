import { IsArray, IsEmail, IsNotEmpty, IsString, ArrayMaxSize, ArrayMinSize, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SendBulkEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsEmail({}, { each: true })
  emails: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  resumeFilename?: string;
}
