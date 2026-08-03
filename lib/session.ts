import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Ensures there is an authenticated admin session.
 * Redirects to /login if not. Use at the top of every server action
 * and protected data-loading path.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}
