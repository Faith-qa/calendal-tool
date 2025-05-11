import { IsNumber, IsString, IsArray, IsOptional, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { IsTimeRange } from '../validators/time-range.validator';

export class CreateSchedulingLinkDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxUses?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  @IsNumber()
  @Min(15)
  @Max(480)
  meetingLength: number;

  @IsNumber()
  @Min(1)
  @Max(90)
  maxDaysInAdvance: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questions?: string[];

  @IsNumber()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsNumber()
  @Min(0)
  @Max(24)
  @IsTimeRange()
  endHour: number;
} 