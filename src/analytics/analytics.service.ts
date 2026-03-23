import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from 'src/sale/entities/sale.entity';
import { SaleDetail } from 'src/sale-detail/entities/sale-detail.entity';
import { Product } from 'src/product/entities/product.entity';
import { Repository } from 'typeorm';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { SalesReportFilterDto } from './dto/sales-report-filter.dto';
import {
  DashboardResponseDto,
  SalesByUserDto,
  SalesTrendPointDto,
  TopClientDto,
  TopProductDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getDashboard(filter: AnalyticsFilterDto): Promise<DashboardResponseDto> {
    const now = new Date();
    const [dayStart, dayEnd] = this.getDayBounds(now);
    const [monthStart, monthEnd] = this.getMonthBounds(now);
    const [trendStart, trendEnd] = this.getTrendBounds(filter, now);

    const [salesToday, salesCurrentMonth, salesCountToday, unitsSoldToday, salesTrend] = await Promise.all([
      this.getSalesTotal(dayStart, dayEnd),
      this.getSalesTotal(monthStart, monthEnd),
      this.getSalesCount(dayStart, dayEnd),
      this.getUnitsSold(dayStart, dayEnd),
      this.getSalesTrend(trendStart, trendEnd),
    ]);

    const averageTicketToday = salesCountToday > 0 ? Number((salesToday / salesCountToday).toFixed(2)) : 0;

    return {
      salesToday,
      salesCurrentMonth,
      salesCountToday,
      averageTicketToday,
      unitsSoldToday,
      salesTrend,
    };
  }

  async getLowStock(threshold?: number): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.stock', 'ASC');

    if (typeof threshold === 'number') {
      query.where('product.stock <= :threshold', { threshold });
    } else {
      query.where('product.stock <= product.minStock');
    }

    return query.getMany();
  }

  async getTopProducts(filter: AnalyticsFilterDto): Promise<TopProductDto[]> {
    const [start, end] = this.getRangeBounds(filter, new Date());
    const limit = filter.limit ?? 10;

    const rows = await this.saleDetailRepository
      .createQueryBuilder('detail')
      .innerJoin('detail.sale', 'sale')
      .innerJoin('detail.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.reference', 'reference')
      .addSelect('product.size', 'size')
      .addSelect('COALESCE(SUM(detail.quantity), 0)', 'unitsSold')
      .addSelect('COALESCE(SUM(detail.quantity * detail.price), 0)', 'totalSold')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('product.id')
      .addGroupBy('product.reference')
      .addGroupBy('product.size')
      .orderBy('SUM(detail.quantity)', 'DESC')
      .limit(limit)
      .getRawMany<{
        productId: string;
        reference: string;
        size: string;
        unitsSold: string;
        totalSold: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      reference: row.reference,
      size: row.size,
      unitsSold: Number(row.unitsSold),
      totalSold: Number(Number(row.totalSold).toFixed(2)),
    }));
  }

  async getSalesByUser(filter: AnalyticsFilterDto): Promise<SalesByUserDto[]> {
    const [start, end] = this.getRangeBounds(filter, new Date());
    const limit = filter.limit ?? 10;

    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'totalSold')
      .addSelect('COUNT(*)', 'salesCount')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('user.id')
      .addGroupBy('user.username')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('SUM(sale.total)', 'DESC')
      .limit(limit)
      .getRawMany<{
        userId: string;
        username: string;
        firstName: string;
        lastName: string;
        totalSold: string;
        salesCount: string;
      }>();

    return rows.map((row) => {
      const totalSold = Number(row.totalSold);
      const salesCount = Number(row.salesCount);

      return {
        userId: row.userId,
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        totalSold: Number(totalSold.toFixed(2)),
        salesCount,
        averageTicket: salesCount > 0 ? Number((totalSold / salesCount).toFixed(2)) : 0,
      };
    });
  }

  async getTopClients(filter: AnalyticsFilterDto): Promise<TopClientDto[]> {
    const [start, end] = this.getRangeBounds(filter, new Date());
    const limit = filter.limit ?? 10;

    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.client', 'client')
      .select('client.id', 'clientId')
      .addSelect('client.documentNumber', 'documentNumber')
      .addSelect('client.firstName', 'firstName')
      .addSelect('client.lastName', 'lastName')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'totalSpent')
      .addSelect('COUNT(*)', 'purchasesCount')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('client.id')
      .addGroupBy('client.documentNumber')
      .addGroupBy('client.firstName')
      .addGroupBy('client.lastName')
      .orderBy('SUM(sale.total)', 'DESC')
      .limit(limit)
      .getRawMany<{
        clientId: string;
        documentNumber: string;
        firstName: string;
        lastName: string;
        totalSpent: string;
        purchasesCount: string;
      }>();

    return rows.map((row) => ({
      clientId: row.clientId,
      documentNumber: row.documentNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      totalSpent: Number(Number(row.totalSpent).toFixed(2)),
      purchasesCount: Number(row.purchasesCount),
    }));
  }

  async getSalesReportCsv(filter: SalesReportFilterDto): Promise<string> {
    const [start, end] = this.getRangeBounds(filter, new Date());

    const query = this.saleDetailRepository
      .createQueryBuilder('detail')
      .innerJoin('detail.sale', 'sale')
      .innerJoin('sale.user', 'user')
      .innerJoin('sale.client', 'client')
      .innerJoin('detail.product', 'product')
      .select('sale.id', 'saleId')
      .addSelect('sale.createdAt', 'createdAt')
      .addSelect('user.id', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('client.id', 'clientId')
      .addSelect('client.documentNumber', 'clientDocumentNumber')
      .addSelect('client.firstName', 'clientFirstName')
      .addSelect('client.lastName', 'clientLastName')
      .addSelect('product.id', 'productId')
      .addSelect('product.reference', 'productReference')
      .addSelect('detail.quantity', 'quantity')
      .addSelect('detail.price', 'unitPrice')
      .addSelect('(detail.quantity * detail.price)', 'lineTotal')
      .addSelect('sale.total', 'saleTotal')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('sale.createdAt', 'DESC');

    if (filter.userId) {
      query.andWhere('user.id = :userId', { userId: filter.userId });
    }

    if (filter.clientId) {
      query.andWhere('client.id = :clientId', { clientId: filter.clientId });
    }

    if (filter.productId) {
      query.andWhere('product.id = :productId', { productId: filter.productId });
    }

    const rows = await query.getRawMany<{
      saleId: string;
      createdAt: Date;
      userId: string;
      username: string;
      clientId: string;
      clientDocumentNumber: string;
      clientFirstName: string;
      clientLastName: string;
      productId: string;
      productReference: string;
      quantity: string;
      unitPrice: string;
      lineTotal: string;
      saleTotal: string;
    }>();

    const headers = [
      'sale_id',
      'created_at',
      'user_id',
      'username',
      'client_id',
      'client_document_number',
      'client_name',
      'product_id',
      'product_reference',
      'quantity',
      'unit_price',
      'line_total',
      'sale_total',
    ];

    const body = rows.map((row) => [
      row.saleId,
      new Date(row.createdAt).toISOString(),
      row.userId,
      row.username,
      row.clientId,
      row.clientDocumentNumber,
      `${row.clientFirstName} ${row.clientLastName}`,
      row.productId,
      row.productReference,
      Number(row.quantity),
      Number(row.unitPrice).toFixed(2),
      Number(row.lineTotal).toFixed(2),
      Number(row.saleTotal).toFixed(2),
    ]);

    return this.toCsv(headers, body);
  }

  async getDailySummaryPayload(date?: string) {
    const base = date ? new Date(date) : new Date();
    const [start, end] = this.getDayBounds(base);

    const [salesTotal, salesCount, unitsSold, topProducts] = await Promise.all([
      this.getSalesTotal(start, end),
      this.getSalesCount(start, end),
      this.getUnitsSold(start, end),
      this.getTopProducts({ from: start.toISOString(), to: end.toISOString(), limit: 5 }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      date: start.toISOString().slice(0, 10),
      salesTotal: Number(salesTotal.toFixed(2)),
      salesCount,
      averageTicket: salesCount > 0 ? Number((salesTotal / salesCount).toFixed(2)) : 0,
      unitsSold,
      topProducts,
    };
  }

  async getLowStockAlertsPayload(threshold?: number) {
    const lowStockItems = await this.getLowStock(threshold);

    return {
      generatedAt: new Date().toISOString(),
      criteria: typeof threshold === 'number' ? { threshold } : { perProductMinStock: true },
      totalAlerts: lowStockItems.length,
      products: lowStockItems.map((product) => {
        const baseline = typeof threshold === 'number' ? threshold : product.minStock;
        const gap = baseline - product.stock;

        return {
          productId: product.id,
          reference: product.reference,
          size: product.size,
          stock: product.stock,
          minStock: product.minStock,
          gap,
          severity: this.getAlertSeverity(product.stock, baseline),
        };
      }),
    };
  }

  private async getSalesTotal(start: Date, end: Date): Promise<number> {
    const raw = await this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();

    return Number(raw?.total ?? 0);
  }

  private async getSalesCount(start: Date, end: Date): Promise<number> {
    const raw = await this.saleRepository
      .createQueryBuilder('sale')
      .select('COUNT(*)', 'count')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne<{ count: string }>();

    return Number(raw?.count ?? 0);
  }

  private async getUnitsSold(start: Date, end: Date): Promise<number> {
    const raw = await this.saleDetailRepository
      .createQueryBuilder('detail')
      .innerJoin('detail.sale', 'sale')
      .select('COALESCE(SUM(detail.quantity), 0)', 'units')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne<{ units: string }>();

    return Number(raw?.units ?? 0);
  }

  private async getSalesTrend(start: Date, end: Date): Promise<SalesTrendPointDto[]> {
    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.createdAt)', 'date')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .addSelect('COUNT(*)', 'salesCount')
      .where('sale.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('DATE(sale.createdAt)', 'ASC')
      .getRawMany<{ date: string; total: string; salesCount: string }>();

    const byDate = new Map<string, SalesTrendPointDto>();
    for (const row of rows) {
      byDate.set(row.date, {
        date: row.date,
        total: Number(row.total),
        salesCount: Number(row.salesCount),
      });
    }

    const points: SalesTrendPointDto[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      points.push(
        byDate.get(key) ?? {
          date: key,
          total: 0,
          salesCount: 0,
        },
      );

      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }

  private getDayBounds(baseDate: Date): [Date, Date] {
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);

    return [start, end];
  }

  private getMonthBounds(baseDate: Date): [Date, Date] {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

    return [start, end];
  }

  private getTrendBounds(filter: AnalyticsFilterDto, baseDate: Date): [Date, Date] {
    if (filter.from && filter.to) {
      const start = new Date(filter.from);
      const end = new Date(filter.to);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }

    const days = filter.trendDays ?? 7;
    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    return [start, end];
  }

  private getRangeBounds(filter: AnalyticsFilterDto, baseDate: Date): [Date, Date] {
    if (filter.from && filter.to) {
      const start = new Date(filter.from);
      const end = new Date(filter.to);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }

    return this.getMonthBounds(baseDate);
  }

  private toCsv(headers: string[], rows: Array<Array<string | number>>): string {
    const allRows = [headers, ...rows];
    return allRows
      .map((row) => row.map((field) => this.escapeCsvField(String(field))).join(','))
      .join('\n');
  }

  private escapeCsvField(value: string): string {
    const escaped = value.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }

    return escaped;
  }

  private getAlertSeverity(stock: number, baseline: number): 'critical' | 'warning' {
    if (stock <= 0 || stock <= Math.floor(baseline * 0.5)) {
      return 'critical';
    }

    return 'warning';
  }
}
