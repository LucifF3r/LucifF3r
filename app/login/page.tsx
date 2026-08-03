import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign in — MotoGarage POS",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">MotoGarage POS</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Sign in to manage sales, invoices, and inventory.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
