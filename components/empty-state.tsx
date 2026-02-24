import { FileTextIcon, KanbanIcon, NetworkIcon } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
          <FileTextIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
          <KanbanIcon className="size-5 text-amber-400" />
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
          <NetworkIcon className="size-5 text-primary" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-balance text-base font-semibold text-foreground">No file open</h2>
        <p className="max-w-xs text-pretty text-sm text-muted-foreground leading-relaxed">
          Right click a folder in the sidebar to create a note, kanban board, or canvas. On mobile, tap the menu button.
        </p>
      </div>
    </div>
  )
}
