import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { generateKeyPair } from 'jose/util/generate_key_pair';
import { fromKeyLike, JWK, KeyLike } from 'jose/jwk/from_key_like';
import { JWTPayload, SignJWT } from 'jose/jwt/sign';
import { importJWK } from 'jose/key/import';
import * as uuid from 'uuid';
import { Config, RedisConfig } from '../common/config/configuration';
import { ConfigService } from '@nestjs/config';
import { Redis, RedisOptions } from 'ioredis';

@Injectable()
export class JwkService implements OnModuleDestroy {
  private readonly redis = this.newRedisClient();

  constructor(private readonly configService: ConfigService<Config>) {}

  async rotate(): Promise<void> {
    let keys = await this.readKeys();

    const algorithm = 'RS256';

    const keyPair = await generateKeyPair(algorithm, {
      modulusLength: 3072,
    });

    const privateKey = await fromKeyLike(keyPair.privateKey);

    privateKey.alg = algorithm;
    privateKey.use = 'sig';
    privateKey.kid = uuid.v4();

    keys.push(privateKey);

    if (keys.length > 2) {
      keys = keys.slice(keys.length - 2);
    }

    await this.writeKeys(keys);
  }

  async sign(
    payload: JWTPayload,
    issuedAt: Date,
    expirationTime: Date,
  ): Promise<string> {
    const keys = await this.readKeys();

    if (keys.length === 0) {
      throw new Error('Missing JWKs');
    }

    const newestKey = keys[keys.length - 1];

    const privateKey = await importJWK(newestKey, newestKey.alg);

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: newestKey.alg, kid: newestKey.kid })
      .setIssuedAt(Math.floor(issuedAt.getTime() / 1000))
      .setExpirationTime(Math.floor(expirationTime.getTime() / 1000))
      .sign(privateKey);

    return jwt;
  }

  async getPublicJWKs(): Promise<KeyLike[]> {
    const keys = await this.readKeys();

    const publicKeys = keys.map((jwk) => {
      return {
        kty: jwk.kty,
        e: jwk.e,
        n: jwk.n,
        alg: jwk.alg,
        use: jwk.use,
        kid: jwk.kid,
      };
    });

    return publicKeys as any;
  }

  private async readKeys(): Promise<JWK[]> {
    const data = await this.redis.get('prices-tf:jwks:keys');
    if (!data) {
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      return [];
    }

    return parsed;
  }

  private async writeKeys(keys: JWK[]): Promise<void> {
    await this.redis.set('prices-tf:jwks:keys', JSON.stringify(keys));
  }

  private newRedisClient(): Redis {
    const redisConfig = this.configService.get<RedisConfig>('redis');

    let options: RedisOptions;

    if (redisConfig.isSentinel) {
      options = {
        sentinels: [
          {
            host: redisConfig.host,
            port: redisConfig.port,
          },
        ],
        name: redisConfig.set,
      };
    } else {
      options = {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
      };
    }

    return new Redis(options);
  }

  async onModuleDestroy() {
    // Close Redis client before stopping
    await this.redis.quit();
  }
}
