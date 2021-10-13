import { Test, TestingModule } from '@nestjs/testing';
import { JwkService } from './jwk.service';

describe('JwkService', () => {
  let service: JwkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwkService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<JwkService>(JwkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
