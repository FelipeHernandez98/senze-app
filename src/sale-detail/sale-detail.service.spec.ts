import { Test, TestingModule } from '@nestjs/testing';
import { SaleDetailService } from './sale-detail.service';

describe('SaleDetailService', () => {
  let service: SaleDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleDetailService],
    }).compile();

    service = module.get<SaleDetailService>(SaleDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
