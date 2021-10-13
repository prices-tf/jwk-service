import { Test, TestingModule } from '@nestjs/testing';
import { JwkController } from './jwk.controller';
import { JwkService } from './jwk.service';

describe('JwkController', () => {
  let controller: JwkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwkController],
      providers: [
        {
          provide: JwkService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<JwkController>(JwkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
