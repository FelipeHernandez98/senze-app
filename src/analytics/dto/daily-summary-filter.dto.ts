import { IsISO8601, IsOptional } from 'class-validator';

export class DailySummaryFilterDto {
  @IsOptional()
  @IsISO8601()
  date?: string;
}
