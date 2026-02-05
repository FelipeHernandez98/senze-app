import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class CreateClientDto {

  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @IsNotEmpty()
  @IsString()
  documentType: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsPhoneNumber('CO')
  phone: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}

