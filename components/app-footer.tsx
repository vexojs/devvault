"use client"

import { GithubIcon } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-border bg-sidebar px-4 py-2">
      <span className="text-xs text-muted-foreground">
        Made by <span className="font-semibold text-foreground">vexojs - 2023</span>
      </span>
      <a
        href="https://github.com/vexojs"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="vexojs on GitHub"
        className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <GithubIcon className="size-4" />
      </a>
    </footer>
  )
}
