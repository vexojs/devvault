"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PlusIcon, Trash2Icon, Link2Icon, PencilIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasFile, CanvasNode } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface NodeCanvasProps {
  file: CanvasFile
  onAddNode: (name: string, x: number, y: number) => void
  onUpdateNode: (nodeId: string, changes: Partial<CanvasNode>) => void
  onDeleteNode: (nodeId: string) => void
  onAddConnection: (fromId: string, toId: string) => void
  onDeleteConnection: (connId: string) => void
}

type DragState =
  | { type: "none" }
  | { type: "node"; nodeId: string; offsetX: number; offsetY: number }
  | { type: "pan"; startX: number; startY: number; startSX: number; startSY: number }

export function NodeCanvas({ file, onAddNode, onUpdateNode, onDeleteNode, onAddConnection, onDeleteConnection }: NodeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState>({ type: "none" })
  const [scroll, setScroll] = useState({ x: 0, y: 0 })
  const [connecting, setConnecting] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [nameDialog, setNameDialog] = useState<{ open: boolean; isNew: boolean; nodeId: string | null }>({ open: false, isNew: true, nodeId: null })
  const [nameValue, setNameValue] = useState("")
  const [editingText, setEditingText] = useState<string | null>(null)
  const [textValue, setTextValue] = useState("")
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: clientX - rect.left + scroll.x, y: clientY - rect.top + scroll.y }
  }, [scroll])
  function handleCanvasDblClick(e: React.MouseEvent) {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).dataset.canvas) return
    const pt = toCanvas(e.clientX, e.clientY)
    setNameValue("New Node")
    setNameDialog({ open: true, isNew: true, nodeId: null })
    pendingPos.current = pt
  }
  const pendingPos = useRef({ x: 100, y: 100 })

  function confirmName() {
    const name = nameValue.trim() || "Untitled"
    if (nameDialog.isNew) {
      onAddNode(name, pendingPos.current.x + scroll.x, pendingPos.current.y + scroll.y)
    } else if (nameDialog.nodeId) {
      onUpdateNode(nameDialog.nodeId, { name })
    }
    setNameDialog({ open: false, isNew: true, nodeId: null })
  }

  function openRename(node: CanvasNode) {
    setNameValue(node.name)
    setNameDialog({ open: true, isNew: false, nodeId: node.id })
  }

  function startEditText(node: CanvasNode) {
    setEditingText(node.id)
    setTextValue(node.text)
  }

  function saveText(nodeId: string) {
    onUpdateNode(nodeId, { text: textValue })
    setEditingText(null)
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  function handleNodeMouseDown(e: React.MouseEvent, node: CanvasNode) {
    if (connecting) { handleConnectClick(node.id); return }
    e.stopPropagation()
    const pt = toCanvas(e.clientX, e.clientY)
    setDrag({ type: "node", nodeId: node.id, offsetX: pt.x - node.x, offsetY: pt.y - node.y })
  }

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (connecting) { setConnecting(null); return }
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
      setDrag({ type: "pan", startX: e.clientX, startY: e.clientY, startSX: scroll.x, startSY: scroll.y })
    }
  }

  function handleConnectClick(nodeId: string) {
    if (!connecting) { setConnecting(nodeId); return }
    if (connecting !== nodeId) onAddConnection(connecting, nodeId)
    setConnecting(null)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (drag.type === "node") {
      const pt = toCanvas(e.clientX, e.clientY)
      onUpdateNode(drag.nodeId, { x: pt.x - drag.offsetX, y: pt.y - drag.offsetY })
    } else if (drag.type === "pan") {
      setScroll({ x: drag.startSX - (e.clientX - drag.startX), y: drag.startSY - (e.clientY - drag.startY) })
    }
    if (connecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setMousePos({ x: e.clientX - rect.left + scroll.x, y: e.clientY - rect.top + scroll.y })
    }
  }, [drag, toCanvas, onUpdateNode, connecting, scroll])

  const onMouseUp = useCallback(() => setDrag({ type: "none" }), [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp) }
  }, [onMouseMove, onMouseUp])

  function nodeCenter(node: CanvasNode) {
    return { x: node.x + node.width / 2, y: node.y + node.height / 2 }
  }

  function openAddDialog() {
    pendingPos.current = { x: 120 + scroll.x + Math.random() * 160, y: 100 + scroll.y + Math.random() * 160 }
    setNameValue("New Node")
    setNameDialog({ open: true, isNew: true, nodeId: null })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button size="sm" variant="secondary" className="h-7 gap-1.5 text-xs" onClick={openAddDialog}>
          <PlusIcon className="size-3.5" />
          <span className="hidden sm:inline">Add Node</span>
          <span className="sm:hidden">Node</span>
        </Button>
        <Button
          size="sm"
          variant={connecting ? "default" : "secondary"}
          className="h-7 gap-1.5 text-xs"
          onClick={() => setConnecting(connecting ? null : "__pick__")}
        >
          <Link2Icon className="size-3.5" />
          <span className="hidden sm:inline">{connecting ? "Cancel" : "Connect"}</span>
        </Button>
        {connecting && (
          <span className="text-xs text-muted-foreground">
            {connecting === "__pick__" ? "Click a node to start" : "Click another node to connect"}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {file.nodes.length} nodes &middot; {file.connections.length} edges
        </span>
      </div>
      <div
        ref={canvasRef}
        data-canvas="true"
        className={cn(
          "relative flex-1 overflow-hidden",
          connecting ? "cursor-crosshair" : drag.type === "pan" ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ backgroundColor: "var(--canvas-bg)" }}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleCanvasDblClick}
      >
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          style={{ transform: `translate(${-(scroll.x % 32)}px, ${-(scroll.y % 32)}px)` }}
        >
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="oklch(0.28 0.008 260)" />
            </pattern>
          </defs>
          <rect width="200%" height="200%" fill="url(#dots)" />
        </svg>
        <svg className="pointer-events-none absolute inset-0 size-full" style={{ overflow: "visible" }}>
          {file.connections.map((conn) => {
            const from = file.nodes.find((n) => n.id === conn.fromNodeId)
            const to = file.nodes.find((n) => n.id === conn.toNodeId)
            if (!from || !to) return null
            const f = nodeCenter(from), t = nodeCenter(to)
            const mx = (f.x + t.x) / 2
            const d = `M ${f.x - scroll.x} ${f.y - scroll.y} C ${mx - scroll.x} ${f.y - scroll.y}, ${mx - scroll.x} ${t.y - scroll.y}, ${t.x - scroll.x} ${t.y - scroll.y}`
            return (
              <g key={conn.id}>
                <path d={d} fill="none" stroke="oklch(0.65 0.19 145 / 0.45)" strokeWidth="2" strokeLinecap="round" />
                <path
                  d={d} fill="none" stroke="transparent" strokeWidth="14"
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => onDeleteConnection(conn.id)}
                />
              </g>
            )
          })}
          {connecting && connecting !== "__pick__" && (() => {
            const from = file.nodes.find((n) => n.id === connecting)
            if (!from) return null
            const f = nodeCenter(from)
            return (
              <line
                x1={f.x - scroll.x} y1={f.y - scroll.y}
                x2={mousePos.x - scroll.x} y2={mousePos.y - scroll.y}
                stroke="oklch(0.65 0.19 145 / 0.7)" strokeWidth="2" strokeDasharray="6 4"
              />
            )
          })()}
        </svg>

        {file.nodes.map((node) => (
          <div
            key={node.id}
            className={cn(
              "group absolute flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-shadow",
              connecting === node.id && "ring-2 ring-primary",
              drag.type === "node" && drag.nodeId === node.id ? "shadow-2xl" : "hover:shadow-xl"
            )}
            style={{
              left: node.x - scroll.x,
              top: node.y - scroll.y,
              width: node.width,
              minHeight: node.height,
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
          >

            <div
              className="flex shrink-0 items-center justify-between px-3 py-2"
              style={{ backgroundColor: node.color }}
            >
              <span className="truncate text-xs font-bold" style={{ color: "#000", opacity: 0.85 }}>
                {node.name}
              </span>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); openRename(node) }}
                  className="flex size-5 items-center justify-center rounded hover:bg-black/20 transition-colors"
                  aria-label="Rename node"
                >
                  <PencilIcon className="size-2.5" style={{ color: "#000" }} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleConnectClick(node.id) }}
                  className="flex size-5 items-center justify-center rounded hover:bg-black/20 transition-colors"
                  aria-label="Connect node"
                >
                  <Link2Icon className="size-2.5" style={{ color: "#000" }} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id) }}
                  className="flex size-5 items-center justify-center rounded hover:bg-black/20 transition-colors"
                  aria-label="Delete node"
                >
                  <XIcon className="size-2.5" style={{ color: "#000" }} />
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-3">
              {editingText === node.id ? (
                <textarea
                  autoFocus
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onBlur={() => saveText(node.id)}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingText(null) }}
                  className="min-h-[3rem] w-full resize-none bg-transparent text-sm leading-relaxed text-card-foreground outline-none placeholder:text-muted-foreground/40"
                  placeholder="Add notes..."
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p
                  className="line-clamp-4 cursor-text break-words text-sm leading-relaxed text-card-foreground/80"
                  onDoubleClick={(e) => { e.stopPropagation(); startEditText(node) }}
                >
                  {node.text || <span className="italic text-muted-foreground/50">Double-click to add notes</span>}
                </p>
              )}
            </div>
          </div>
        ))}
        {file.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="select-none text-sm text-muted-foreground/50">
              Double-click the canvas or click "Add Node" to get started
            </p>
          </div>
        )}
      </div>
      <Dialog open={nameDialog.open} onOpenChange={(o) => setNameDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{nameDialog.isNew ? "New Node" : "Rename Node"}</DialogTitle>
            <DialogDescription className="sr-only">Enter a name for the node.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); confirmName() }}>
            <Input autoFocus value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Node name..." />
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setNameDialog((p) => ({ ...p, open: false }))}>Cancel</Button>
              <Button type="submit">{nameDialog.isNew ? "Create" : "Rename"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
