"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          nativeButton={false}
          render={
            <Link href="/new-sale">
              <PlusCircle data-icon="inline-start" />
              New Sale
            </Link>
          }
        />
        <ThemeToggle />
      </div>
    </header>
  )
}
