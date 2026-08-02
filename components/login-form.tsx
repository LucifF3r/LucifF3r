"use client"

import { useActionState } from "react"
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

export function LoginForm() {
  const [errorMessage, formAction] = useActionState(login, undefined)

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction}>
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
                placeholder="admin@garage.com"
                autoComplete="email"
                required
                defaultValue="admin@garage.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </Field>
            <SubmitButton />
            <p className="text-center text-xs text-muted-foreground text-balance">
              Default login: admin@garage.com / admin123 — change it in Settings after first sign-in.
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
