import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { JWK } from 'jose/types';
import { SignPayloadDto } from './dto/sign-payload.dto';
import { JwkService } from './jwk.service';

@Controller('jwks')
export class JwkController {
  constructor(private readonly jwkService: JwkService) {}

  @Post('rotate')
  private rotate(): Promise<void> {
    return this.jwkService.rotate();
  }

  @Get()
  private get(): Promise<{ keys: JWK[] }> {
    return this.jwkService.getPublicJWKs().then((keys) => ({ keys }));
  }

  @Post('sign')
  private sign(
    @Body(new ValidationPipe({ transform: true })) body: SignPayloadDto,
  ): Promise<{ jwt: string }> {
    return this.jwkService
      .sign(body.payload, body.issuedAt, body.expiresAt)
      .then((jwt) => ({ jwt }));
  }
}
