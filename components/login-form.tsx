"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { login } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  )
}

const LAST_EMAIL_KEY = "revline:lastLoginEmail"

export function LoginForm() {
  const [errorMessage, formAction] = useActionState(login, undefined)
  const [email, setEmail] = useState("")

  // Restore the last email used on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_EMAIL_KEY)
      if (saved) setEmail(saved)
    } catch {
      // localStorage may be unavailable; ignore.
    }
  }, [])

  function rememberEmail() {
    try {
      if (email) localStorage.setItem(LAST_EMAIL_KEY, email)
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} onSubmit={rememberEmail}>
          <FieldGroup>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </Field>
            <SubmitButton />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
