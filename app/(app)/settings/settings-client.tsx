"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2Icon, BuildingIcon, KeyRoundIcon, UserIcon, UploadIcon, XIcon } from "lucide-react"
import { updateGarageProfile, changePassword, updateAdminName } from "./actions"

/**
 * Reads an image file and downscales it on a canvas to keep the stored
 * base64 payload small. Returns a PNG data URL (preserves transparency).
 */
async function fileToResizedDataUrl(file: File, maxSize = 256): Promise<string> {
  const readAsDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("read failed"))
    reader.readAsDataURL(file)
  })

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("decode failed"))
    img.src = readAsDataUrl
  })

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas unsupported")
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL("image/png")
}

type Profile = {
  name: string
  logoUrl: string
  address: string
  phone: string
  email: string
  currencySymbol: string
  taxRate: number
}

type ActionState = { error?: string; success?: string } | undefined

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function SettingsClient({ profile, displayName }: { profile: Profile; displayName: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <BusinessProfileForm profile={profile} />
      <DisplayNameForm displayName={displayName} />
      <PasswordForm />
    </div>
  )
}

function DisplayNameForm({ displayName }: { displayName: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateAdminName, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserIcon className="size-5 text-muted-foreground" />
          <CardTitle>Your account</CardTitle>
        </div>
        <CardDescription>The display name shown in the sidebar and across the app.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Display name</FieldLabel>
              <Input id="displayName" name="displayName" defaultValue={displayName} required />
            </Field>
            <div className="flex justify-end">
              <SubmitButton label="Update name" pendingLabel="Saving…" />
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function BusinessProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateGarageProfile, undefined)
  const [logoData, setLogoData] = useState(profile.logoUrl)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset so choosing the same file again still fires onChange.
    e.target.value = ""
    if (!file) return

    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error("Please choose a PNG or JPEG image")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }

    try {
      setProcessing(true)
      const dataUrl = await fileToResizedDataUrl(file)
      setLogoData(dataUrl)
    } catch {
      toast.error("Could not read that image. Try a different file.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BuildingIcon className="size-5 text-muted-foreground" />
          <CardTitle>Business profile</CardTitle>
        </div>
        <CardDescription>
          These details appear on your invoices, quotations, and PDF documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {logoData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoData || "/placeholder.svg"}
                      alt="Garage logo preview"
                      className="size-full object-contain"
                      onError={() => setLogoData("")}
                    />
                  ) : (
                    <BuildingIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {processing ? (
                      <Loader2Icon className="animate-spin" data-icon="inline-start" />
                    ) : (
                      <UploadIcon data-icon="inline-start" />
                    )}
                    {logoData ? "Change logo" : "Upload logo"}
                  </Button>
                  {logoData ? (
                    <Button type="button" variant="ghost" onClick={() => setLogoData("")}>
                      <XIcon data-icon="inline-start" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              {/* Hidden field carries the resized image (base64) to the server action. */}
              <input type="hidden" name="logoUrl" value={logoData} />
              <FieldDescription>PNG or JPEG. Resized automatically for crisp printing.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Garage name</FieldLabel>
              <Input id="name" name="name" defaultValue={profile.name} required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" name="phone" defaultValue={profile.phone} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" defaultValue={profile.email} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea id="address" name="address" rows={2} defaultValue={profile.address} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="currencySymbol">Currency symbol</FieldLabel>
                <Input
                  id="currencySymbol"
                  name="currencySymbol"
                  defaultValue={profile.currencySymbol}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="taxRate">Tax rate (%)</FieldLabel>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={profile.taxRate}
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <SubmitButton label="Save changes" pendingLabel="Saving…" />
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(changePassword, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRoundIcon className="size-5 text-muted-foreground" />
          <CardTitle>Change password</CardTitle>
        </div>
        <CardDescription>Update the password used to sign in to this account.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* key forces the form (and its native fields) to reset after a successful change */}
        <form action={formAction} key={state?.success ?? "pw"}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <SubmitButton label="Change password" pendingLabel="Updating…" />
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
