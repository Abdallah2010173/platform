import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Request } from 'express';

export interface GoogleProfileUser {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
}

const OAUTH_STATE_COOKIE = 'oauth_state';

/** Minimal cookie parser (no external dependency) for the OAuth state cookie. */
function parseCookies(header?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/**
 * Passport Google OAuth 2.0 strategy.
 *
 * The strategy performs the OAuth handshake and (importantly) validates the
 * `state` query parameter against an HttpOnly cookie set when the flow began,
 * preventing OAuth CSRF / login-attack. Account creation / look-up / linking is
 * handled by the AuthService so we can reuse the exact same JWT issuance flow
 * as normal login.
 */
export interface GoogleStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(options: GoogleStrategyOptions) {
    super({
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: ['email', 'profile'],
      state: false,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    try {
      // CSRF / login-attack protection: the `state` in the callback must match
      // the one we issued and stored in an HttpOnly cookie at flow start.
      const stateParam = (req.query?.state as string | undefined) ?? '';
      const stateCookie = parseCookies(req.headers?.cookie)[OAUTH_STATE_COOKIE] ?? '';
      if (!stateParam || stateParam !== stateCookie) {
        throw new UnauthorizedException('OAuth state mismatch');
      }

      const email = profile.emails?.[0]?.value ?? null;
      if (!email) {
        throw new UnauthorizedException('Google account has no email address');
      }

      const firstName =
        profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
      const lastName =
        profile.name?.familyName ||
        profile.displayName?.split(' ').slice(1).join(' ') ||
        '';

      const user: GoogleProfileUser = {
        googleId: profile.id,
        email: email.toLowerCase(),
        emailVerified: profile.emails?.[0]?.verified ?? false,
        firstName,
        lastName,
        displayName: profile.displayName || email.split('@')[0] || '',
        avatarUrl: profile.photos?.[0]?.value ?? undefined,
      };

      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
