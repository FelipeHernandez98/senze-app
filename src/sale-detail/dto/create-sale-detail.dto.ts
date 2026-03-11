import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class CreateSaleDetailDto {

  @IsOptional()
  @IsUUID()
  saleId?: string;

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

}

