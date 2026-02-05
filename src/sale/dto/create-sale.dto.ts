import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleDetailDto } from 'src/sale-detail/dto/create-sale-detail.dto';


export class CreateSaleDto {

  @IsUUID()
  clientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  details: CreateSaleDetailDto[];
}


