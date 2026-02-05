import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsPositive,
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

  @IsPositive()
  price: number;
}

