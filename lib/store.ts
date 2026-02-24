// ─── Types ───────────────────────────────────────────────────────────────────

export type FileType = "note" | "kanban" | "canvas"

export interface Folder {
  id: string
  name: string
  parentId: string | null
}

export interface AppFile {
  id: string
  name: string
  type: FileType
  folderId: string
  createdAt: number
  updatedAt: number
}

// Note
export interface NoteFile extends AppFile {
  type: "note"
  content: string
}

// Kanban
export interface KanbanCard {
  id: string
  title: string
  description: string
  columnId: string
  order: number
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  order: number
}

export interface KanbanFile extends AppFile {
  type: "kanban"
  columns: KanbanColumn[]
  cards: KanbanCard[]
}

// Canvas
export interface CanvasNode {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  text: string
  color: string
}

export interface CanvasConnection {
  id: string
  fromNodeId: string
  toNodeId: string
}

export interface CanvasFile extends AppFile {
  type: "canvas"
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}

export type AnyFile = NoteFile | KanbanFile | CanvasFile

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  folders: Folder[]
  files: AnyFile[]
  activeFileId: string | null
  expandedFolders: string[]
}

// ─── Default state ───────────────────────────────────────────────────────────

const ROOT_FOLDER_ID = "root"

export function defaultState(): AppState {
  const rootFolder: Folder = { id: ROOT_FOLDER_ID, name: "My Workspace", parentId: null }
  const defaultFolderId = generateId()
  const defaultFolder: Folder = { id: defaultFolderId, name: "Projects", parentId: ROOT_FOLDER_ID }

  const noteId = generateId()
  const note: NoteFile = {
    id: noteId,
    name: "Welcome",
    type: "note",
    folderId: defaultFolderId,
    content: `# Welcome to DevVault\n\nYour personal developer workspace.\n\n## Features\n\n- **Notes** - Write markdown notes with live preview\n- **Kanban** - GitHub-style boards with custom columns\n- **Canvas** - Connect nodes with bezier lines\n\n## Getting Started\n\nRight-click any folder in the sidebar to create files.\n`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const kanbanId = generateId()
  const col1Id = generateId()
  const col2Id = generateId()
  const col3Id = generateId()
  const kanban: KanbanFile = {
    id: kanbanId,
    name: "Example Board",
    type: "kanban",
    folderId: defaultFolderId,
    columns: [
      { id: col1Id, title: "To Do", color: "#6366f1", order: 0 },
      { id: col2Id, title: "In Progress", color: "#f59e0b", order: 1 },
      { id: col3Id, title: "Done", color: "#22c55e", order: 2 },
    ],
    cards: [
      { id: generateId(), title: "Read the docs", description: "Check out the feature list", columnId: col1Id, order: 0 },
      { id: generateId(), title: "Build something cool", description: "", columnId: col2Id, order: 0 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const canvasId = generateId()
  const n1 = generateId()
  const n2 = generateId()
  const canvas: CanvasFile = {
    id: canvasId,
    name: "Example Canvas",
    type: "canvas",
    folderId: defaultFolderId,
    nodes: [
      { id: n1, name: "Idea", x: 80, y: 100, width: 180, height: 80, text: "Start here", color: "#22c55e" },
      { id: n2, name: "Next Step", x: 340, y: 200, width: 180, height: 80, text: "Then go here", color: "#6366f1" },
    ],
    connections: [{ id: generateId(), fromNodeId: n1, toNodeId: n2 }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return {
    folders: [rootFolder, defaultFolder],
    files: [note, kanban, canvas],
    activeFileId: noteId,
    expandedFolders: [ROOT_FOLDER_ID, defaultFolderId],
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "devvault-v2"

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return JSON.parse(raw) as AppState
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    
  }
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
