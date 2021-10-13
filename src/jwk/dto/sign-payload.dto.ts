import { Type } from 'class-transformer';
import { IsDate, IsObject, IsOptional } from 'class-validator';

export class SignPayloadDto {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  issuedAt: Date;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @IsObject()
  readonly payload: any;
}
