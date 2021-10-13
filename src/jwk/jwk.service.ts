import { Injectable } from '@nestjs/common';
import * as writeFileAtomic from 'write-file-atomic';
import { promises as fs } from 'fs';
import { generateKeyPair } from 'jose/util/generate_key_pair';
import { fromKeyLike, JWK, KeyLike } from 'jose/jwk/from_key_like';
import { JWTPayload, SignJWT } from 'jose/jwt/sign';
import { importJWK } from 'jose/key/import';
import * as uuid from 'uuid';
import { Config } from '../common/config/configuration';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class JwkService {
  private jwksPath = path.join(
    this.configService.get('dataDir'),
    './jwks.json',
  );

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
    const data = await fs.readFile(this.jwksPath, 'utf-8').catch(() => {
      return '[]';
    });

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      return [];
    }

    return parsed;
  }

  private async writeKeys(keys: JWK[]): Promise<void> {
    await writeFileAtomic(this.jwksPath, JSON.stringify(keys, undefined, 4));
  }
}
