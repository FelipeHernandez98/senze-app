import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

jest.mock('src/user/decorators/auth.decorator', () => ({
  Auth: () => () => undefined,
}));

import { AnalyticsController } from '../src/analytics/analytics.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;

  const analyticsServiceMock = {
    getDashboard: jest.fn(),
    getLowStock: jest.fn(),
    getTopProducts: jest.fn(),
    getSalesByUser: jest.fn(),
    getTopClients: jest.fn(),
    getSalesReportCsv: jest.fn(),
    getDailySummaryPayload: jest.fn(),
    getLowStockAlertsPayload: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('/api/analytics/dashboard (GET)', async () => {
    analyticsServiceMock.getDashboard.mockResolvedValue({
      salesToday: 100,
      salesCurrentMonth: 500,
      salesCountToday: 2,
      averageTicketToday: 50,
      unitsSoldToday: 4,
      salesTrend: [],
    });

    const response = await request(app.getHttpServer()).get('/api/analytics/dashboard').expect(200);

    expect(response.body.salesToday).toBe(100);
    expect(analyticsServiceMock.getDashboard).toHaveBeenCalled();
  });

  it('/api/analytics/top-products (GET)', async () => {
    analyticsServiceMock.getTopProducts.mockResolvedValue([{ productId: 'p1', unitsSold: 10 }]);

    const response = await request(app.getHttpServer())
      .get('/api/analytics/top-products?limit=5')
      .expect(200);

    expect(response.body).toEqual([{ productId: 'p1', unitsSold: 10 }]);
    expect(analyticsServiceMock.getTopProducts).toHaveBeenCalled();
  });

  it('/api/analytics/sales-by-user (GET)', async () => {
    analyticsServiceMock.getSalesByUser.mockResolvedValue([{ userId: 'u1', totalSold: 500 }]);

    const response = await request(app.getHttpServer())
      .get('/api/analytics/sales-by-user?limit=5')
      .expect(200);

    expect(response.body).toEqual([{ userId: 'u1', totalSold: 500 }]);
  });

  it('/api/analytics/top-clients (GET)', async () => {
    analyticsServiceMock.getTopClients.mockResolvedValue([{ clientId: 'c1', totalSpent: 700 }]);

    const response = await request(app.getHttpServer())
      .get('/api/analytics/top-clients?limit=5')
      .expect(200);

    expect(response.body).toEqual([{ clientId: 'c1', totalSpent: 700 }]);
  });

  it('/api/analytics/reports/sales.csv (GET)', async () => {
    analyticsServiceMock.getSalesReportCsv.mockResolvedValue('sale_id,created_at\n1,2026-03-12T00:00:00.000Z');

    const response = await request(app.getHttpServer())
      .get('/api/analytics/reports/sales.csv')
      .expect(200);

    expect(response.text).toContain('sale_id,created_at');
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('sales-report-');
  });

  it('/api/analytics/automation/daily-summary (GET)', async () => {
    analyticsServiceMock.getDailySummaryPayload.mockResolvedValue({
      date: '2026-03-12',
      salesTotal: 1000,
      salesCount: 5,
    });

    const response = await request(app.getHttpServer())
      .get('/api/analytics/automation/daily-summary')
      .expect(200);

    expect(response.body.date).toBe('2026-03-12');
  });

  it('/api/analytics/automation/low-stock-alerts (GET)', async () => {
    analyticsServiceMock.getLowStockAlertsPayload.mockResolvedValue({
      totalAlerts: 1,
      products: [{ productId: 'p1', severity: 'warning' }],
    });

    const response = await request(app.getHttpServer())
      .get('/api/analytics/automation/low-stock-alerts')
      .expect(200);

    expect(response.body.totalAlerts).toBe(1);
    expect(response.body.products).toHaveLength(1);
  });
});
