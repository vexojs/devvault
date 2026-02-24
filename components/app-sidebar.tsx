"use client"

import { useState } from "react"
import {
  FolderIcon, FolderOpenIcon, FileTextIcon, KanbanIcon, NetworkIcon,
  PlusIcon, ChevronRightIcon, Trash2Icon, PencilIcon, MenuIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppFile, AppState, Folder, FileType } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const FILE_ICONS: Record<string, typeof FileTextIcon> = {
  note: FileTextIcon,
  kanban: KanbanIcon,
  canvas: NetworkIcon,
}

const FILE_COLORS: Record<string, string> = {
  note: "text-muted-foreground",
  kanban: "text-amber-400",
  canvas: "text-primary",
}

type DialogMode =
  | { action: "newFolder"; parentId: string }
  | { action: "newFile"; folderId: string; type: FileType }
  | { action: "renameFolder"; id: string }
  | { action: "renameFile"; id: string }

interface SidebarCoreProps {
  state: AppState
  onSelectFile: (id: string) => void
  onToggleFolder: (id: string) => void
  onAddFolder: (name: string, parentId: string) => void
  onAddFile: (type: FileType, name: string, folderId: string) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFolder: (id: string, name: string) => void
  onRenameFile: (id: string, name: string) => void
  onClose?: () => void
}

function SidebarTree({
  state, onSelectFile, onToggleFolder, onAddFolder,
  onAddFile, onDeleteFile, onDeleteFolder, onRenameFolder, onRenameFile,
  onClose,
}: SidebarCoreProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>({ action: "newFolder", parentId: "root" })
  const [value, setValue] = useState("")

  function openDialog(m: DialogMode, defaultVal = "") {
    setMode(m); setValue(defaultVal); setDialogOpen(true)
  }

  function handleSubmit() {
    const v = value.trim(); if (!v) return
    if (mode.action === "newFolder") onAddFolder(v, mode.parentId)
    else if (mode.action === "newFile") onAddFile(mode.type, v, mode.folderId)
    else if (mode.action === "renameFolder") onRenameFolder(mode.id, v)
    else if (mode.action === "renameFile") onRenameFile(mode.id, v)
    setDialogOpen(false)
  }

  function handleSelect(id: string) {
    onSelectFile(id)
    onClose?.()
  }

  function getChildren(parentId: string): Folder[] {
    return state.folders.filter((f) => f.parentId === parentId)
  }
  function getFiles(folderId: string): AppFile[] {
    return state.files.filter((f) => f.folderId === folderId)
  }

  function renderFolder(folder: Folder, depth = 0): React.ReactNode {
    const expanded = state.expandedFolders.includes(folder.id)
    const FIcon = expanded ? FolderOpenIcon : FolderIcon
    const children = getChildren(folder.id)
    const files = getFiles(folder.id)

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => onToggleFolder(folder.id)}
              className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <ChevronRightIcon className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
              <FIcon className="size-4 shrink-0 text-primary" />
              <span className="truncate">{folder.name}</span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => openDialog({ action: "newFile", folderId: folder.id, type: "note" }, "Untitled Note")}>
              <FileTextIcon className="size-4" /> New Note
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openDialog({ action: "newFile", folderId: folder.id, type: "kanban" }, "Untitled Board")}>
              <KanbanIcon className="size-4" /> New Kanban Board
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openDialog({ action: "newFile", folderId: folder.id, type: "canvas" }, "Untitled Canvas")}>
              <NetworkIcon className="size-4" /> New Canvas
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => openDialog({ action: "newFolder", parentId: folder.id }, "New Folder")}>
              <FolderIcon className="size-4" /> New Folder
            </ContextMenuItem>
            {folder.id !== "root" && (
              <>
                <ContextMenuItem onClick={() => openDialog({ action: "renameFolder", id: folder.id }, folder.name)}>
                  <PencilIcon className="size-4" /> Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onClick={() => onDeleteFolder(folder.id)}>
                  <Trash2Icon className="size-4" /> Delete Folder
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {expanded && (
          <div>
            {children.map((c) => renderFolder(c, depth + 1))}
            {files.map((file) => {
              const Icon = FILE_ICONS[file.type] ?? FileTextIcon
              const iconColor = FILE_COLORS[file.type] ?? "text-muted-foreground"
              const active = state.activeFileId === file.id
              return (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      onClick={() => handleSelect(file.id)}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                    >
                      <Icon className={cn("size-4 shrink-0", iconColor)} />
                      <span className="truncate">{file.name}</span>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => openDialog({ action: "renameFile", id: file.id }, file.name)}>
                      <PencilIcon className="size-4" /> Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onClick={() => onDeleteFile(file.id)}>
                      <Trash2Icon className="size-4" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const root = state.folders.find((f) => f.id === "root")

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {root && renderFolder(root)}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {mode.action === "newFolder" ? "New Folder"
                : mode.action === "newFile"
                ? `New ${mode.type === "note" ? "Note" : mode.type === "kanban" ? "Kanban Board" : "Canvas"}`
                : mode.action === "renameFolder" ? "Rename Folder"
                : "Rename File"}
            </DialogTitle>
            <DialogDescription className="sr-only">Enter a name.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
            <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter name..." />
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Confirm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Desktop sidebar
export function AppSidebar(props: SidebarCoreProps) {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">DevVault</span>
        <button
          onClick={() => props.onAddFolder("New Folder", "root")}
          className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label="Add folder"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      <SidebarTree {...props} />
    </aside>
  )
}

// Mobile header bar + sheet
export function MobileHeader(props: SidebarCoreProps) {
  const [open, setOpen] = useState(false)
  const activeFile = props.state.files.find((f) => f.id === props.state.activeFileId)
  const ActiveIcon = activeFile ? FILE_ICONS[activeFile.type] ?? FileTextIcon : null

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3 py-2 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-sidebar-foreground">
            <MenuIcon className="size-4" />
            <span className="text-sm font-semibold">DevVault</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-4 py-3">
            <SheetTitle className="text-sm font-semibold text-sidebar-foreground">DevVault</SheetTitle>
          </SheetHeader>
          <SidebarTree {...props} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      {activeFile && ActiveIcon && (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-sidebar-foreground">
          <ActiveIcon className={cn("size-3.5 shrink-0", FILE_COLORS[activeFile.type])} />
          <span className="truncate">{activeFile.name}</span>
        </div>
      )}
    </div>
  )
}
