import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleDetailDto } from 'src/sale-detail/dto/create-sale-detail.dto';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { SaleStatus } from 'src/common/enums/sale-status.enum';


export class CreateSaleDto {

  @IsUUID()
  clientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  details: CreateSaleDetailDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(SaleStatus)
  status: SaleStatus;
}


