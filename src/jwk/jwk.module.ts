import { Module } from '@nestjs/common';
import { JwkService } from './jwk.service';
import { JwkController } from './jwk.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [JwkService],
  controllers: [JwkController],
})
export class JwkModule {}
