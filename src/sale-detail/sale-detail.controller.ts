import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaleDetailService } from './sale-detail.service';
import { CreateSaleDetailDto } from './dto/create-sale-detail.dto';
import { UpdateSaleDetailDto } from './dto/update-sale-detail.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';

@Controller('sale-detail')
export class SaleDetailController {
  constructor(private readonly saleDetailService: SaleDetailService) {}

  @Post()
  @Auth(Roles.administrator)
  create(@Body() createSaleDetailDto: CreateSaleDetailDto) {
    return this.saleDetailService.create(createSaleDetailDto);
  }

  @Get()
  @Auth(Roles.administrator, Roles.user)
  findAll() {
    return this.saleDetailService.findAll();
  }

  @Get(':id')
  @Auth(Roles.administrator, Roles.user)
  findOne(@Param('id') id: string) {
    return this.saleDetailService.findOne(id);
  }

  @Patch(':id')
  @Auth(Roles.administrator)
  update(@Param('id') id: string, @Body() updateSaleDetailDto: UpdateSaleDetailDto) {
    return this.saleDetailService.update(id, updateSaleDetailDto);
  }

  @Delete(':id')
  @Auth(Roles.administrator)
  remove(@Param('id') id: string) {
    return this.saleDetailService.remove(id);
  }
}
