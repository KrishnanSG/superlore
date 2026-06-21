/**
 * Pluggable, optional auth for superlore — Auth.js v5 + Google SSO out of the box. OFF unless
 * configured: `createAuthProxy` only enforces when `AUTH_GOOGLE_ID` is set (and not `LOCAL`),
 * so a public deploy needs no auth at all. The MCP inherits the site's policy via the proxy.
 *
 * Required env when enabled: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_URL,
 * AUTH_TRUST_HOST=true. Optional: AUTH_ALLOWED_DOMAIN, AUTH_ALLOWED_EMAILS (comma-separated).
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse, type NextRequest } from "next/server";

export interface SuperloreAuthOptions {
  /** Workspace domain allowed to sign in (e.g. "acme.com"). Empty = any Google account. */
  allowedDomain?: string;
  /** Explicit email allowlist that bypasses the domain check. */
  allowedEmails?: string[];
  /** Extra NextAuth config merged over the defaults. */
  config?: Partial<NextAuthConfig>;
}

/** Build the Auth.js v5 instance. Returns `{ handlers, auth, signIn, signOut }`. */
export function createSuperloreAuth(options: SuperloreAuthOptions = {}) {
  const allowedDomain = options.allowedDomain ?? process.env.AUTH_ALLOWED_DOMAIN ?? "";
  const allowedEmails =
    options.allowedEmails ??
    (process.env.AUTH_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  return NextAuth({
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        authorization: {
          params: {
            scope: "openid email profile",
            prompt: "select_account",
            ...(allowedDomain ? { hd: allowedDomain } : {}),
          },
        },
      }),
    ],
    pages: { signIn: "/auth/signin", error: "/auth/error" },
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ profile }) {
        const email = profile?.email?.toLowerCase();
        if (!email) return false;
        if (allowedEmails.includes(email)) return true;
        if (!allowedDomain) return true; // no domain restriction configured → any Google account
        return email.split("@")[1] === allowedDomain;
      },
    },
    ...options.config,
  });
}

const defaultPublic = (pathname: string): boolean =>
  pathname.startsWith("/api/auth/") ||
  pathname.startsWith("/auth/") ||
  pathname.startsWith("/_next/") ||
  pathname === "/favicon.ico" ||
  pathname.startsWith("/icon") ||
  pathname.startsWith("/opengraph-image");

export interface AuthProxyOptions {
  /** Paths that bypass the gate. Defaults to the auth dance, Next internals, and icons. */
  isPublic?: (pathname: string) => boolean;
  /** Force-enable/disable. Defaults to ON only when AUTH_GOOGLE_ID is set and LOCAL !== "true". */
  enforce?: boolean;
  signInPath?: string;
}

type AuthMiddleware = ReturnType<typeof createSuperloreAuth>["auth"];

/**
 * Build a Next.js 16 `proxy.ts` default export from a superlore auth instance. Self-disabling: with
 * no `AUTH_GOOGLE_ID` it passes everything through, so local dev and public deploys stay open.
 */
export function createAuthProxy(auth: AuthMiddleware, options: AuthProxyOptions = {}) {
  const enforce = options.enforce ?? (!!process.env.AUTH_GOOGLE_ID && process.env.LOCAL !== "true");
  const isPublic = options.isPublic ?? defaultPublic;
  const signInPath = options.signInPath ?? "/auth/signin";

  const gated = auth((request: NextRequest & { auth: unknown | null }) => {
    const { pathname, search } = request.nextUrl;
    if (!isPublic(pathname) && !request.auth) {
      const url = new URL(signInPath, request.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  });

  return enforce ? gated : () => NextResponse.next();
}
