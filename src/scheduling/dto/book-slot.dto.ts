import { IsEmail, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class BookSlotDto {
  @IsString()
  slotId: string;

  @IsEmail()
  email: string;

  @IsArray()
  @IsOptional()
  answers?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 