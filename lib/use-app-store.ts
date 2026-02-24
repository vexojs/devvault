"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  type AppState,
  type AnyFile,
  type FileType,
  type NoteFile,
  type KanbanFile,
  type KanbanCard,
  type KanbanColumn,
  type CanvasFile,
  type CanvasNode,
  type CanvasConnection,
  type Folder,
  generateId,
  loadState,
  saveState,
} from "@/lib/store"

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => loadState())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persist = useCallback((next: AppState) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveState(next), 300)
  }, [])

  function update(next: AppState) {
    setState(next)
    persist(next)
  }

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  // ── Navigation ──────────────────────────────────────────────────────────────
  function setActiveFile(id: string) {
    update({ ...state, activeFileId: id })
  }

  function toggleFolder(id: string) {
    const expanded = state.expandedFolders.includes(id)
      ? state.expandedFolders.filter((f) => f !== id)
      : [...state.expandedFolders, id]
    update({ ...state, expandedFolders: expanded })
  }

  // ── Folder CRUD ─────────────────────────────────────────────────────────────
  function addFolder(name: string, parentId: string) {
    const folder: Folder = { id: generateId(), name, parentId }
    update({
      ...state,
      folders: [...state.folders, folder],
      expandedFolders: [...state.expandedFolders, folder.id],
    })
  }

  function renameFolder(id: string, name: string) {
    update({ ...state, folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)) })
  }

  function deleteFolder(id: string) {
    const toDelete = new Set<string>()
    const queue = [id]
    while (queue.length) {
      const cur = queue.pop()!
      toDelete.add(cur)
      state.folders.filter((f) => f.parentId === cur).forEach((f) => queue.push(f.id))
    }
    const deletedFileIds = state.files.filter((f) => toDelete.has(f.folderId)).map((f) => f.id)
    const nextActive = deletedFileIds.includes(state.activeFileId ?? "")
      ? null
      : state.activeFileId
    update({
      ...state,
      folders: state.folders.filter((f) => !toDelete.has(f.id)),
      files: state.files.filter((f) => !toDelete.has(f.folderId)),
      activeFileId: nextActive,
    })
  }

  // ── File CRUD ───────────────────────────────────────────────────────────────
  function addFile(type: FileType, name: string, folderId: string) {
    const base = { id: generateId(), name, type, folderId, createdAt: Date.now(), updatedAt: Date.now() }
    let file: AnyFile

    if (type === "note") {
      file = { ...base, type: "note", content: "" } as NoteFile
    } else if (type === "kanban") {
      const col1 = generateId(), col2 = generateId(), col3 = generateId()
      file = {
        ...base, type: "kanban",
        columns: [
          { id: col1, title: "To Do", color: "#6366f1", order: 0 },
          { id: col2, title: "In Progress", color: "#f59e0b", order: 1 },
          { id: col3, title: "Done", color: "#22c55e", order: 2 },
        ],
        cards: [],
      } as KanbanFile
    } else {
      file = { ...base, type: "canvas", nodes: [], connections: [] } as CanvasFile
    }

    update({ ...state, files: [...state.files, file], activeFileId: file.id })
  }

  function renameFile(id: string, name: string) {
    update({ ...state, files: state.files.map((f) => (f.id === id ? { ...f, name, updatedAt: Date.now() } : f)) })
  }

  function deleteFile(id: string) {
    update({
      ...state,
      files: state.files.filter((f) => f.id !== id),
      activeFileId: state.activeFileId === id ? null : state.activeFileId,
    })
  }

  // ── Note ─────────────────────────────────────────────────────────────────────
  function updateNote(id: string, content: string) {
    update({
      ...state,
      files: state.files.map((f) =>
        f.id === id && f.type === "note" ? { ...f, content, updatedAt: Date.now() } : f
      ),
    })
  }

  // ── Kanban ───────────────────────────────────────────────────────────────────
  function updateKanban(id: string, changes: Partial<Pick<KanbanFile, "columns" | "cards">>) {
    update({
      ...state,
      files: state.files.map((f) =>
        f.id === id && f.type === "kanban"
          ? { ...f, ...changes, updatedAt: Date.now() }
          : f
      ),
    })
  }

  function addKanbanColumn(fileId: string, title: string, color: string) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    const col: KanbanColumn = { id: generateId(), title, color, order: file.columns.length }
    updateKanban(fileId, { columns: [...file.columns, col] })
  }

  function renameKanbanColumn(fileId: string, colId: string, title: string) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    updateKanban(fileId, { columns: file.columns.map((c) => (c.id === colId ? { ...c, title } : c)) })
  }

  function deleteKanbanColumn(fileId: string, colId: string) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    updateKanban(fileId, {
      columns: file.columns.filter((c) => c.id !== colId),
      cards: file.cards.filter((c) => c.columnId !== colId),
    })
  }

  function addKanbanCard(fileId: string, columnId: string, title: string) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    const colCards = file.cards.filter((c) => c.columnId === columnId)
    const card: KanbanCard = { id: generateId(), title, description: "", columnId, order: colCards.length }
    updateKanban(fileId, { cards: [...file.cards, card] })
  }

  function updateKanbanCard(fileId: string, cardId: string, changes: Partial<Pick<KanbanCard, "title" | "description" | "columnId" | "order">>) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    updateKanban(fileId, { cards: file.cards.map((c) => (c.id === cardId ? { ...c, ...changes } : c)) })
  }

  function deleteKanbanCard(fileId: string, cardId: string) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    updateKanban(fileId, { cards: file.cards.filter((c) => c.id !== cardId) })
  }

  function moveKanbanCard(fileId: string, cardId: string, toColumnId: string, toOrder: number) {
    const file = state.files.find((f) => f.id === fileId) as KanbanFile | undefined
    if (!file) return
    let cards = file.cards.map((c) => (c.id === cardId ? { ...c, columnId: toColumnId, order: toOrder } : c))

    const destCards = cards.filter((c) => c.columnId === toColumnId).sort((a, b) => a.order - b.order)
    destCards.forEach((c, i) => { cards = cards.map((cc) => (cc.id === c.id ? { ...cc, order: i } : cc)) })
    updateKanban(fileId, { cards })
  }

  function reorderKanbanColumns(fileId: string, columns: KanbanColumn[]) {
    updateKanban(fileId, { columns })
  }

  // ── Canvas ───────────────────────────────────────────────────────────────────
  function updateCanvas(id: string, changes: Partial<Pick<CanvasFile, "nodes" | "connections">>) {
    update({
      ...state,
      files: state.files.map((f) =>
        f.id === id && f.type === "canvas"
          ? { ...f, ...changes, updatedAt: Date.now() }
          : f
      ),
    })
  }

  function addCanvasNode(fileId: string, name: string, x: number, y: number) {
    const file = state.files.find((f) => f.id === fileId) as CanvasFile | undefined
    if (!file) return
    const COLORS = ["#22c55e","#6366f1","#f59e0b","#ec4899","#06b6d4","#f97316"]
    const node: CanvasNode = {
      id: generateId(), name, x, y, width: 200, height: 90,
      text: "",
      color: COLORS[file.nodes.length % COLORS.length],
    }
    updateCanvas(fileId, { nodes: [...file.nodes, node] })
  }

  function updateCanvasNode(fileId: string, nodeId: string, changes: Partial<CanvasNode>) {
    const file = state.files.find((f) => f.id === fileId) as CanvasFile | undefined
    if (!file) return
    updateCanvas(fileId, { nodes: file.nodes.map((n) => (n.id === nodeId ? { ...n, ...changes } : n)) })
  }

  function deleteCanvasNode(fileId: string, nodeId: string) {
    const file = state.files.find((f) => f.id === fileId) as CanvasFile | undefined
    if (!file) return
    updateCanvas(fileId, {
      nodes: file.nodes.filter((n) => n.id !== nodeId),
      connections: file.connections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId),
    })
  }

  function addCanvasConnection(fileId: string, fromNodeId: string, toNodeId: string) {
    const file = state.files.find((f) => f.id === fileId) as CanvasFile | undefined
    if (!file) return
    const exists = file.connections.some(
      (c) => (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) || (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId)
    )
    if (exists) return
    const conn: CanvasConnection = { id: generateId(), fromNodeId, toNodeId }
    updateCanvas(fileId, { connections: [...file.connections, conn] })
  }

  function deleteCanvasConnection(fileId: string, connId: string) {
    const file = state.files.find((f) => f.id === fileId) as CanvasFile | undefined
    if (!file) return
    updateCanvas(fileId, { connections: file.connections.filter((c) => c.id !== connId) })
  }

  const activeFile = state.files.find((f) => f.id === state.activeFileId) ?? null

  return {
    state, activeFile,
    setActiveFile, toggleFolder,
    addFolder, renameFolder, deleteFolder,
    addFile, renameFile, deleteFile,
    updateNote,
    addKanbanColumn, renameKanbanColumn, deleteKanbanColumn,
    addKanbanCard, updateKanbanCard, deleteKanbanCard,
    moveKanbanCard, reorderKanbanColumns,
    addCanvasNode, updateCanvasNode, deleteCanvasNode,
    addCanvasConnection, deleteCanvasConnection,
  }
}
