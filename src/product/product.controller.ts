import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Auth(Roles.administrator)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Auth(Roles.administrator, Roles.user)
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @Auth(Roles.administrator, Roles.user)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Auth(Roles.administrator)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Auth(Roles.administrator)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
