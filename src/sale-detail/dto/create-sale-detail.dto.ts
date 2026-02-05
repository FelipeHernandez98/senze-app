import { IsUUID, IsInt, Min, IsPositive } from 'class-validator';

export class CreateSaleDetailDto {

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

}

