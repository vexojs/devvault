"use client"

import { useAppStore } from "@/lib/use-app-store"
import { AppSidebar, MobileHeader } from "@/components/app-sidebar"
import { NoteEditor } from "@/components/note-editor"
import { KanbanBoard } from "@/components/kanban-board"
import { NodeCanvas } from "@/components/node-canvas"
import { EmptyState } from "@/components/empty-state"
import { AppFooter } from "@/components/app-footer"
import type { NoteFile, KanbanFile, CanvasFile } from "@/lib/store"

export function DevVaultApp() {
  const store = useAppStore()
  const { state, activeFile } = store

  const sharedSidebarProps = {
    state,
    onSelectFile: store.setActiveFile,
    onToggleFolder: store.toggleFolder,
    onAddFolder: store.addFolder,
    onAddFile: store.addFile,
    onDeleteFile: store.deleteFile,
    onDeleteFolder: store.deleteFolder,
    onRenameFolder: store.renameFolder,
    onRenameFile: store.renameFile,
  }

  function renderContent() {
    if (!activeFile) return <EmptyState />

    if (activeFile.type === "note") {
      const note = activeFile as NoteFile
      return (
        <NoteEditor
          key={note.id}
          file={note}
          onUpdate={(content) => store.updateNote(note.id, content)}
        />
      )
    }

    if (activeFile.type === "kanban") {
      const kb = activeFile as KanbanFile
      return (
        <KanbanBoard
          key={kb.id}
          file={kb}
          onAddColumn={(title, color) => store.addKanbanColumn(kb.id, title, color)}
          onRenameColumn={(colId, title) => store.renameKanbanColumn(kb.id, colId, title)}
          onDeleteColumn={(colId) => store.deleteKanbanColumn(kb.id, colId)}
          onReorderColumns={(cols) => store.reorderKanbanColumns(kb.id, cols)}
          onAddCard={(colId, title) => store.addKanbanCard(kb.id, colId, title)}
          onUpdateCard={(cardId, changes) => store.updateKanbanCard(kb.id, cardId, changes)}
          onDeleteCard={(cardId) => store.deleteKanbanCard(kb.id, cardId)}
          onMoveCard={(cardId, toColId, toOrder) => store.moveKanbanCard(kb.id, cardId, toColId, toOrder)}
        />
      )
    }

    if (activeFile.type === "canvas") {
      const cv = activeFile as CanvasFile
      return (
        <NodeCanvas
          key={cv.id}
          file={cv}
          onAddNode={(name, x, y) => store.addCanvasNode(cv.id, name, x, y)}
          onUpdateNode={(nodeId, changes) => store.updateCanvasNode(cv.id, nodeId, changes)}
          onDeleteNode={(nodeId) => store.deleteCanvasNode(cv.id, nodeId)}
          onAddConnection={(fromId, toId) => store.addCanvasConnection(cv.id, fromId, toId)}
          onDeleteConnection={(connId) => store.deleteCanvasConnection(cv.id, connId)}
        />
      )
    }

    return <EmptyState />
  }

  return (
    <div className="flex h-screen flex-col bg-background font-sans">
      <MobileHeader {...sharedSidebarProps} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar {...sharedSidebarProps} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {activeFile && (
            <div className="flex shrink-0 items-center border-b border-border bg-card px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">{activeFile.name}</span>
              <span className="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                {activeFile.type}
              </span>
            </div>
          )}
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </main>
      </div>
      <AppFooter />
    </div>
  )
}
