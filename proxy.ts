import NextAuth from "next-auth"
import type { NextFetchEvent, NextRequest } from "next/server"
import { authConfig } from "@/auth.config"

// Next.js 16 renamed middleware.ts -> proxy.ts. NextAuth's `auth` handler runs
// the `authorized` callback in auth.config.ts, which controls the
// redirect/authentication logic. We wrap it in an explicit `proxy` function so
// the production build's static analysis reliably detects the function export.
const { auth } = NextAuth(authConfig)

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // @ts-expect-error NextAuth's auth handler is callable as proxy/middleware.
  return auth(request, event)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.mp4$|.*\\.webm$).*)",
  ],
}
