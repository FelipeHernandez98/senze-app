import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {

  @IsNotEmpty()
  @IsString()
  reference: string;

  @IsNotEmpty()
  @IsString()
  size: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsPositive()
  price: number;
}

