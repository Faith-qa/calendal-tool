import { IsString, IsOptional, IsArray } from 'class-validator';

export class BookSlotDto {
  @IsString()
  slotId: string;

  @IsString()
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answers?: string[] = []; // Default to empty array

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  schedulingLinkId?: string;

  @IsString()
  @IsOptional()
  date?: string;
}