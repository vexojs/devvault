"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EyeIcon, PencilIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { NoteFile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NoteEditorProps {
  file: NoteFile
  onUpdate: (content: string) => void
}

export function NoteEditor({ file, onUpdate }: NoteEditorProps) {
  const [content, setContent] = useState(file.content)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setContent(file.content)
  }, [file.id, file.content])

  const handleChange = useCallback(
    (val: string) => {
      setContent(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onUpdate(val), 300)
    },
    [onUpdate]
  )

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const lines = content.split("\n").length

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1 rounded-md bg-secondary p-0.5">
          <Button
            size="sm"
            variant={mode === "edit" ? "default" : "ghost"}
            className="h-6 gap-1.5 px-2.5 text-xs"
            onClick={() => setMode("edit")}
          >
            <PencilIcon className="size-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant={mode === "preview" ? "default" : "ghost"}
            className="h-6 gap-1.5 px-2.5 text-xs"
            onClick={() => setMode("preview")}
          >
            <EyeIcon className="size-3" />
            Preview
          </Button>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">
          {lines} {lines === 1 ? "line" : "lines"} &middot; {content.length} chars
        </span>
      </div>
      {mode === "edit" ? (
        <div className="flex flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="hidden w-10 shrink-0 select-none flex-col items-end overflow-hidden py-4 pr-3 pl-2 font-mono text-xs leading-6 text-muted-foreground/40 sm:flex"
          >
            {content.split("\n").map((_, i) => (
              <span key={i} className="leading-6">{i + 1}</span>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 resize-none bg-transparent px-3 py-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/40 sm:px-0 sm:pr-4"
            placeholder="Start typing..."
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-6 py-6 sm:px-10">
          {content.trim() ? (
            <div className="dv-md mx-auto max-w-3xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nothing to preview yet. Switch to Edit and write something.</p>
          )}
        </div>
      )}
    </div>
  )
}
