import { Controller, Get, ParseIntPipe, Query, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { Auth } from 'src/user/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import { SalesReportFilterDto } from './dto/sales-report-filter.dto';
import { Response } from 'express';
import { DailySummaryFilterDto } from './dto/daily-summary-filter.dto';

@Controller('analytics')
@Auth(Roles.administrator, Roles.user)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getDashboard(filter);
  }

  @Get('low-stock')
  getLowStock(@Query('threshold', new ParseIntPipe({ optional: true })) threshold?: number) {
    return this.analyticsService.getLowStock(threshold);
  }

  @Get('top-products')
  getTopProducts(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getTopProducts(filter);
  }

  @Get('sales-by-user')
  getSalesByUser(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getSalesByUser(filter);
  }

  @Get('top-clients')
  getTopClients(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getTopClients(filter);
  }

  @Get('reports/sales.csv')
  async getSalesCsvReport(@Query() filter: SalesReportFilterDto, @Res() response: Response) {
    const csv = await this.analyticsService.getSalesReportCsv(filter);
    const timestamp = new Date().toISOString().slice(0, 10);

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="sales-report-${timestamp}.csv"`);
    response.send(csv);
  }

  @Get('automation/daily-summary')
  getDailySummary(@Query() filter: DailySummaryFilterDto) {
    return this.analyticsService.getDailySummaryPayload(filter.date);
  }

  @Get('automation/low-stock-alerts')
  getLowStockAlerts(@Query('threshold', new ParseIntPipe({ optional: true })) threshold?: number) {
    return this.analyticsService.getLowStockAlertsPayload(threshold);
  }
}
