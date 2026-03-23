import { Controller, Get, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from 'src/common/enums/roles.enum';
import { Auth } from 'src/user/decorators/auth.decorator';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
@Auth(Roles.administrator, Roles.user)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':saleId/pdf')
  async getInvoicePdf(@Param('saleId', new ParseUUIDPipe()) saleId: string, @Res() response: Response) {
    const { buffer, fileName } = await this.invoiceService.generateInvoicePdf(saleId);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.send(buffer);
  }

  @Get(':saleId/preview')
  async getInvoicePreview(@Param('saleId', new ParseUUIDPipe()) saleId: string) {
    return this.invoiceService.generateInvoicePreview(saleId);
  }
}
