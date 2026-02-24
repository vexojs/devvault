# DevVault

A personal workspace app for web developers. Organize your notes, kanban boards, and node canvases with a folder-based file system -- all saved to localStorage.
Built in 2023, By Abdellah Ketoun (vexojs)

Built with [Next.js](https://nextjs.org), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), and [shadcn/ui](https://ui.shadcn.com).

---

## Features

### Folder & File Tree
- Hierarchical folder structure with nested subfolders
- Right-click any folder to create a **Note**, **Kanban Board**, or **Canvas**
- Right-click files or folders to **rename** or **delete** them
- Expandable/collapsible tree with visual file type icons

### Note Editor
- Monospace text editor with line numbers
- Auto-saves as you type (300ms debounce)
- **Markdown preview**: Toggle between Edit and Preview modes with the buttons in the toolbar
- Preview renders full GitHub-Flavored Markdown (headings, bold, italic, links, code blocks, tables, task lists, blockquotes, strikethrough) with a dark-themed stylesheet
- Displays line count, character count, and last updated timestamp

### Kanban Board
- Three columns out of the box: **To Do**, **In Progress**, **Done**
- Drag-and-drop cards between columns
- Click card descriptions to edit them inline
- Add new cards via the "Add card" button at the bottom of each column

### Node Canvas
- Add named nodes to an infinite pannable canvas
- Rename nodes via the pencil icon or through the rename dialog
- Double-click a node body to add/edit description text
- Connect nodes with smooth bezier curves using the **Link Nodes** button
- Click a connection line to delete it
- Drag nodes to reposition, drag the canvas background to pan

### Responsive Design
- Desktop: persistent sidebar with full file tree
- Mobile: hamburger menu opens a slide-out sheet with the file tree
- All views (notes, kanban, canvas) adapt to smaller screens

### Persistence
- All data (folders, files, file contents, canvas positions, kanban cards) is stored in **localStorage**
- Data persists across page reloads -- no backend or database required
- Storage key: `devvault-state`

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [React 19](https://react.dev) | UI library |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com) | Component library (Dialog, Button, Input, Sheet, ScrollArea, ContextMenu, Tabs) |
| [Radix UI](https://radix-ui.com) | Accessible primitives powering shadcn/ui components |
| [Lucide React](https://lucide.dev) | Icons |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering in preview mode |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | GitHub Flavored Markdown support (tables, task lists, strikethrough) |
| [TypeScript](https://typescriptlang.org) | Type safety |

---

## Project Structure

```
app/
  layout.tsx          # Root layout with fonts and metadata
  page.tsx            # Entry point, renders DevVaultApp
  globals.css         # Tailwind v4 config with custom design tokens

components/
  devvault-app.tsx      # Main app shell: sidebar + content area + footer
  app-sidebar.tsx     # Folder/file tree with right-click context menus
  note-editor.tsx     # Monospace note editor with line numbers
  kanban-board.tsx    # Drag-and-drop kanban board
  node-canvas.tsx     # Infinite canvas with draggable nodes and connections
  empty-state.tsx     # Shown when no file is selected
  app-footer.tsx      # Footer with "Made by vexojs" and GitHub link
  ui/                 # shadcn/ui components (button, dialog, input, etc.)

lib/
  store.ts            # Types, localStorage persistence, factory functions
  use-app-store.ts    # React hook wrapping all state operations
  utils.ts            # Utility functions (cn for classnames)
```

---

## How It Works

1. **State Management**: The entire app state (folders, files, active file, expanded folders) lives in a single `AppState` object managed by the `useAppStore` hook. Every mutation calls `saveState()` which writes the full state to `localStorage`.

2. **Creating Items**: Right-click any folder in the sidebar to open a context menu with options to create Notes, Kanban Boards, Canvases, or sub-Folders. A dialog prompts you for a name, then the item is created and selected.

3. **Editing**: Selecting a file in the tree opens it in the main content area. Notes auto-save on keystroke. Kanban cards and canvas nodes save immediately on interaction.

4. **Responsive Layout**: On desktop (md+), the sidebar is a permanent 256px panel. On mobile, it collapses into a hamburger menu that opens a Sheet (slide-out drawer). The active file name is shown in the mobile header bar.

---

## Getting Started

```bash
git clone https://github.com/vexojs/devvault.git
cd devvault
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

MIT

---

Made by [vexojs](https://github.com/vexojs)
