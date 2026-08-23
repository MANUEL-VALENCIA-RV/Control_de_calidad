import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

const SESSION_COOKIE = 'cc_session';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly secret: string;

  constructor() {
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error(
        'Falta la variable de entorno AUTH_SECRET. Sin ella no se pueden validar las sesiones.',
      );
    }

    this.secret = secret;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    const email = token ? this.verify(token) : null;

    if (!email) {
      throw new UnauthorizedException(
        'Sesión no válida o expirada',
      );
    }

    (
      request as Request & {
        sessionEmail?: string;
      }
    ).sessionEmail = email;

    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;

    if (header?.startsWith('Bearer ')) {
      return header.slice(7).trim() || null;
    }

    const cookie = (request.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim())
      .find((part) =>
        part.startsWith(`${SESSION_COOKIE}=`)
      );

    return cookie
      ? decodeURIComponent(
          cookie.slice(SESSION_COOKIE.length + 1)
        )
      : null;
  }

  private verify(token: string): string | null {
    const parts = token.split('|');

    if (parts.length !== 3) return null;

    const [email, expStr, signature] = parts;
    const exp = Number(expStr);

    if (!Number.isFinite(exp) || exp < Date.now()) {
      return null;
    }

    const payload = `${email}|${expStr}`;

    const expected = Buffer.from(
      this.sign(payload)
    );

    const received = Buffer.from(signature);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    return email;
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }
}
