import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { CreateUserWithRoleDto } from './dto/create-user-with-role.dto';
import { Roles } from 'src/common/enums/roles.enum';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('admin')
  @Auth( Roles.administrator)
  createAdmin(@Body() createUserWithRole: CreateUserWithRoleDto) {
    return this.userService.CreateUserWithRole(createUserWithRole);
  }

  @Get()
  @Auth()
  findAll() {
    return this.userService.findAll();
  }

  @Get('findById')
  @Auth( Roles.administrator , Roles.user )
  findOne(
    @GetUser() user: User
  ) {
    return this.userService.findOne(user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto){
    return this.userService.login( loginUserDto );
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ){
    return this.userService.checkAuthStatus( user );
  }
}
