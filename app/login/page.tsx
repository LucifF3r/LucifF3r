import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in — ASL Motors POS",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/asl-motors-logo.png" alt="ASL Motors" className="h-28 w-auto" />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">ASL Motors POS</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Sign in to manage sales, invoices, and inventory.
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          Developed by Ahsal | Palm Isle Collectives &copy; 2026
        </p>
      </div>
    </main>
  )
}
