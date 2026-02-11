import { IsString, IsNotEmpty, MinLength, IsIn } from 'class-validator';

export class CreateUserWithRoleDto {

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsIn([0, 1])
  roleId: number;
}