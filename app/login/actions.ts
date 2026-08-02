"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function login(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Invalid email or password."
      }
      return "Something went wrong. Please try again."
    }
    // Re-throw redirect errors (Next.js uses errors for redirects)
    throw error
  }
}
