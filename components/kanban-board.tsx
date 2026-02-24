"use client"

import { useRef, useState } from "react"
import {
  PlusIcon, Trash2Icon, PencilIcon, MoreHorizontalIcon,
  GripVerticalIcon, ChevronLeftIcon, ChevronRightIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { KanbanCard, KanbanColumn, KanbanFile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Column color presets ─────────────────────────────────────────────────────
const COLOR_PRESETS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899",
  "#06b6d4", "#f97316", "#a855f7", "#14b8a6",
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface KanbanBoardProps {
  file: KanbanFile
  onAddColumn: (title: string, color: string) => void
  onRenameColumn: (colId: string, title: string) => void
  onDeleteColumn: (colId: string) => void
  onReorderColumns: (cols: KanbanColumn[]) => void
  onAddCard: (columnId: string, title: string) => void
  onUpdateCard: (cardId: string, changes: Partial<Pick<KanbanCard, "title" | "description" | "columnId" | "order">>) => void
  onDeleteCard: (cardId: string) => void
  onMoveCard: (cardId: string, toColumnId: string, toOrder: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function KanbanBoard({
  file, onAddColumn, onRenameColumn, onDeleteColumn, onReorderColumns,
  onAddCard, onUpdateCard, onDeleteCard, onMoveCard,
}: KanbanBoardProps) {
  const columns = [...file.columns].sort((a, b) => a.order - b.order)
  const [dragging, setDragging] = useState<{ card: KanbanCard; fromColId: string } | null>(null)
  const [dragOver, setDragOver] = useState<{ colId: string; order: number } | null>(null)
  const [addColOpen, setAddColOpen] = useState(false)
  const [newColTitle, setNewColTitle] = useState("")
  const [newColColor, setNewColColor] = useState(COLOR_PRESETS[0])
  const [renameColOpen, setRenameColOpen] = useState(false)
  const [renamingCol, setRenamingCol] = useState<KanbanColumn | null>(null)
  const [renameColValue, setRenameColValue] = useState("")
  const [editCardOpen, setEditCardOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [addingInCol, setAddingInCol] = useState<string | null>(null)
  const [addCardTitle, setAddCardTitle] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)

  // ── Add column ───────────────────────────────────────────────────────────────
  function handleAddColumn() {
    const title = newColTitle.trim()
    if (!title) return
    onAddColumn(title, newColColor)
    setNewColTitle(""); setNewColColor(COLOR_PRESETS[0]); setAddColOpen(false)
  }

  // ── Rename column ─────────────────────────────────────────────────────────────
  function openRenameCol(col: KanbanColumn) {
    setRenamingCol(col); setRenameColValue(col.title); setRenameColOpen(true)
  }
  function handleRenameCol() {
    if (!renamingCol || !renameColValue.trim()) return
    onRenameColumn(renamingCol.id, renameColValue.trim())
    setRenameColOpen(false)
  }

  // ── Move column ───────────────────────────────────────────────────────────────
  function moveColumnLeft(col: KanbanColumn) {
    const idx = columns.findIndex((c) => c.id === col.id)
    if (idx <= 0) return
    const next = columns.map((c, i) => {
      if (i === idx - 1) return { ...c, order: idx }
      if (i === idx) return { ...c, order: idx - 1 }
      return c
    })
    onReorderColumns(next)
  }
  function moveColumnRight(col: KanbanColumn) {
    const idx = columns.findIndex((c) => c.id === col.id)
    if (idx >= columns.length - 1) return
    const next = columns.map((c, i) => {
      if (i === idx) return { ...c, order: idx + 1 }
      if (i === idx + 1) return { ...c, order: idx }
      return c
    })
    onReorderColumns(next)
  }

  // ── Cards for a column ────────────────────────────────────────────────────────
  function colCards(colId: string) {
    return file.cards.filter((c) => c.columnId === colId).sort((a, b) => a.order - b.order)
  }

  // ── Inline add card ────────────────────────────────────────────────────────────
  function startAddCard(colId: string) {
    setAddingInCol(colId); setAddCardTitle("")
    setTimeout(() => addInputRef.current?.focus(), 50)
  }
  function confirmAddCard() {
    if (!addingInCol || !addCardTitle.trim()) { setAddingInCol(null); return }
    onAddCard(addingInCol, addCardTitle.trim())
    setAddingInCol(null); setAddCardTitle("")
  }

  // ── Edit card ─────────────────────────────────────────────────────────────────
  function openEditCard(card: KanbanCard) {
    setEditingCard(card); setEditTitle(card.title); setEditDesc(card.description); setEditCardOpen(true)
  }
  function saveEditCard() {
    if (!editingCard) return
    onUpdateCard(editingCard.id, { title: editTitle.trim() || editingCard.title, description: editDesc })
    setEditCardOpen(false)
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────────
  function handleDragStart(card: KanbanCard) {
    setDragging({ card, fromColId: card.columnId })
  }
  function handleDragOver(e: React.DragEvent, colId: string, order: number) {
    e.preventDefault()
    setDragOver({ colId, order })
  }
  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault()
    if (!dragging) return
    const toOrder = dragOver?.colId === colId ? (dragOver.order ?? colCards(colId).length) : colCards(colId).length
    onMoveCard(dragging.card.id, colId, toOrder)
    setDragging(null); setDragOver(null)
  }
  function handleDragEnd() {
    setDragging(null); setDragOver(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button size="sm" variant="secondary" className="h-7 gap-1.5 text-xs" onClick={() => setAddColOpen(true)}>
          <PlusIcon className="size-3.5" />
          Add Column
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {columns.length} columns &middot; {file.cards.length} cards
        </span>
      </div>
      <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 sm:gap-4 sm:p-4">
        {columns.map((col, colIdx) => {
          const cards = colCards(col.id)
          const isDragTarget = dragOver?.colId === col.id

          return (
            <div
              key={col.id}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-xl border border-border bg-secondary/30 transition-colors sm:w-72",
                isDragTarget && "border-primary/50 bg-primary/5"
              )}
              onDragOver={(e) => handleDragOver(e, col.id, cards.length)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-2.5">
                <div className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{col.title}</span>
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                  {cards.length}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground">
                      <MoreHorizontalIcon className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openRenameCol(col)}>
                      <PencilIcon className="size-4" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveColumnLeft(col)} disabled={colIdx === 0}>
                      <ChevronLeftIcon className="size-4" /> Move Left
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveColumnRight(col)} disabled={colIdx === columns.length - 1}>
                      <ChevronRightIcon className="size-4" /> Move Right
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDeleteColumn(col.id)}>
                      <Trash2Icon className="size-4" /> Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ScrollArea className="flex-1 px-2">
                <div className="flex flex-col gap-2 pb-2">
                  {cards.map((card, cardIdx) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card)}
                      onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, col.id, cardIdx) }}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group w-full cursor-grab overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md active:cursor-grabbing active:opacity-60",
                        dragging?.card.id === card.id && "opacity-40"
                      )}
                    >
                      <div className="h-0.5 w-full" style={{ backgroundColor: col.color }} />
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVerticalIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
                          <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-card-foreground line-clamp-2">
                            {card.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditCard(card) }}
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Edit card"
                            >
                              <PencilIcon className="size-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id) }}
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Delete card"
                            >
                              <Trash2Icon className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        {card.description && (
                          <p className="mt-1.5 break-words pl-5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {card.description}
                          </p>
                        )}
                        {columns.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1 pl-5">
                            {columns.filter((c) => c.id !== col.id).map((c) => (
                              <button
                                key={c.id}
                                onClick={(e) => { e.stopPropagation(); onMoveCard(card.id, c.id, colCards(c.id).length) }}
                                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                              >
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {addingInCol === col.id ? (
                    <div className="rounded-lg border border-primary/40 bg-card p-2">
                      <input
                        ref={addInputRef}
                        value={addCardTitle}
                        onChange={(e) => setAddCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmAddCard()
                          if (e.key === "Escape") setAddingInCol(null)
                        }}
                        onBlur={confirmAddCard}
                        placeholder="Card title..."
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                      <div className="mt-2 flex gap-1">
                        <Button size="sm" className="h-6 text-xs" onClick={confirmAddCard}>Add</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setAddingInCol(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startAddCard(col.id)}
                      className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <PlusIcon className="size-3.5" />
                      Add card
                    </button>
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
        {columns.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No columns yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Click "Add Column" to get started</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addColOpen} onOpenChange={setAddColOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Column</DialogTitle>
            <DialogDescription className="sr-only">Enter a title and choose a color.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddColumn() }}>
            <div className="flex flex-col gap-3">
              <Input
                autoFocus
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="Column title (e.g. To Do, In Review...)"
              />
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColColor(c)}
                      className={cn("size-7 rounded-full border-2 transition-transform hover:scale-110", newColColor === c ? "border-foreground" : "border-transparent")}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setAddColOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameColOpen} onOpenChange={setRenameColOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogDescription className="sr-only">Enter a new name.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleRenameCol() }}>
            <Input autoFocus value={renameColValue} onChange={(e) => setRenameColValue(e.target.value)} />
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setRenameColOpen(false)}>Cancel</Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editCardOpen} onOpenChange={setEditCardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription className="sr-only">Update card title and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveEditCard() }}>
            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Title</p>
                <Input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Card title..." />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Description</p>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
              {columns.length > 1 && editingCard && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Move to column</p>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (!editingCard) return
                          onMoveCard(editingCard.id, c.id, colCards(c.id).length)
                          setEditCardOpen(false)
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                          c.id === editingCard.columnId
                            ? "border-foreground text-foreground"
                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                        )}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setEditCardOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
