import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { Sale } from 'src/sale/entities/sale.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    private readonly configService: ConfigService,
  ) {}

  async generateInvoicePdf(saleId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const rendered = await this.buildRenderedHtml(saleId);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(rendered.html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return {
        buffer: Buffer.from(pdf),
        fileName: `factura-${rendered.invoiceCode}.pdf`,
      };
    } finally {
      await browser.close();
    }
  }

  async generateInvoicePreview(saleId: string): Promise<{ invoiceNumber: string; html: string }> {
    const rendered = await this.buildRenderedHtml(saleId);

    return {
      invoiceNumber: rendered.invoiceCode,
      html: rendered.html,
    };
  }

  private async buildRenderedHtml(saleId: string): Promise<{ html: string; invoiceCode: string }> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: {
        user: true,
        client: true,
        details: {
          product: true,
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${saleId} not found`);
    }

    const template = this.getTemplateHtml();
    const invoiceCode = this.getInvoiceCode(sale);

    const items = sale.details
      .map((detail) => {
        const lineTotal = Number(detail.price) * detail.quantity;
        return `
          <tr>
            <td>${this.escapeHtml(detail.product.reference)} (${this.escapeHtml(detail.product.size)})</td>
            <td>${detail.quantity}</td>
            <td>${this.formatMoney(Number(detail.price))}</td>
            <td>${this.formatMoney(lineTotal)}</td>
          </tr>
        `;
      })
      .join('');

    const subtotal = Number(sale.total);
    const tax = 0;
    const total = subtotal;

    const replacements: Record<string, string> = {
      logo_url: this.getLogoDataUrl(),
      company_name: this.configService.get<string>('COMPANY_NAME') ?? 'Senze App',
      company_nit: this.configService.get<string>('COMPANY_NIT') ?? 'N/A',
      company_address: this.configService.get<string>('COMPANY_ADDRESS') ?? 'N/A',
      company_phone: this.configService.get<string>('COMPANY_PHONE') ?? 'N/A',
      company_email: this.configService.get<string>('COMPANY_EMAIL') ?? 'N/A',
      invoice_number: invoiceCode,
      invoice_date: this.formatDate(sale.createdAt),
      seller: `${sale.user.firstName} ${sale.user.lastName}`,
      client_name: `${sale.client.firstName} ${sale.client.lastName}`,
      client_document: `${sale.client.documentType} ${sale.client.documentNumber}`,
      client_phone: sale.client.phone,
      client_address: sale.client.address,
      payment_method: sale.paymentMethod,
      invoice_status: sale.status,
      items,
      subtotal: this.formatMoney(subtotal),
      tax: this.formatMoney(tax),
      total: this.formatMoney(total),
      qr_code: await QRCode.toDataURL(invoiceCode),
    };

    const html = this.applyTemplateReplacements(template, replacements);

    return {
      html,
      invoiceCode,
    };
  }

  private getTemplateHtml(): string {
    const candidatePaths = [
      path.join(__dirname, 'templates', 'factura.html'),
      path.join(process.cwd(), 'dist', 'invoice', 'templates', 'factura.html'),
      path.join(process.cwd(), 'dist', 'src', 'invoice', 'templates', 'factura.html'),
      path.join(process.cwd(), 'src', 'invoice', 'templates', 'factura.html'),
    ];

    const templatePath = candidatePaths.find((currentPath) => fs.existsSync(currentPath));

    if (!templatePath) {
      throw new NotFoundException('Invoice template factura.html was not found in expected paths');
    }

    return fs.readFileSync(templatePath, 'utf-8');
  }

  private getLogoDataUrl(): string {
    const logoPath = this.configService.get<string>('INVOICE_LOGO_PATH') ?? path.join(process.cwd(), 'logo-factura.png');

    if (!fs.existsSync(logoPath)) {
      return '';
    }

    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }

  private getInvoiceCode(sale: Sale): string {
    if (sale.invoiceNumber) {
      return String(sale.invoiceNumber).padStart(8, '0');
    }

    return sale.id.slice(0, 8).toUpperCase();
  }

  private applyTemplateReplacements(template: string, replacements: Record<string, string>): string {
    let html = template;

    for (const [key, value] of Object.entries(replacements)) {
      html = html.split(`{{${key}}}`).join(value);
    }

    return html;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
