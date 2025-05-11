import { IsEmail, IsString, IsArray, IsOptional, IsObject, IsDateString, Matches, ValidateIf } from 'class-validator';

export class BookSlotDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, {
    message: 'slotId must be in format YYYY-MM-DDTHH:mm:ss.sssZ-YYYY-MM-DDTHH:mm:ss.sssZ',
  })
  slotId: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsOptional()
  answers?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  schedulingLinkId?: string;

  @ValidateIf((o) => o.date !== undefined)
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date?: string;
} 