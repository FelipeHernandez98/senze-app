import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Auth(Roles.administrator)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @Auth(Roles.administrator, Roles.user)
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  @Auth(Roles.administrator, Roles.user)
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
  @Auth(Roles.administrator)
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Auth(Roles.administrator)
  remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }
}
