import { Test, TestingModule } from '@nestjs/testing';
import { StockPhotoService } from './media-stock.service';

describe('StockPhotoService', () => {
  let service: StockPhotoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockPhotoService],
    }).compile();

    service = module.get<StockPhotoService>(StockPhotoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
