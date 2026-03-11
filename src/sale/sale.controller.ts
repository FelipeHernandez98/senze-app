import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import { GetUser } from 'src/user/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @Auth(Roles.administrator, Roles.user)
  create(@Body() createSaleDto: CreateSaleDto, @GetUser() user: User) {
    return this.saleService.create(createSaleDto, user);
  }

  @Get()
  @Auth(Roles.administrator, Roles.user)
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  @Auth(Roles.administrator, Roles.user)
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }

  @Patch(':id')
  @Auth(Roles.administrator)
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return this.saleService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @Auth(Roles.administrator)
  remove(@Param('id') id: string) {
    return this.saleService.remove(id);
  }
}
