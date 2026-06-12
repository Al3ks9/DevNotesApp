# DevNotes — UI/UX Specification

## Overview

DevNotes is a personal notes application for a developer audience. The target user writes `.md` and `.txt` files, works exclusively in VS Code, and needs a centralized place to write, organize, and search notes. The app replaces scattered files across the filesystem with a single editor-first interface.

The UI must feel like something a developer would keep open all day: dense but not cluttered, keyboard-first, no unnecessary motion, no chrome.

---

## Tech Stack (UI)

- React with TypeScript
- CSS Modules for component-scoped styles (one `.module.css` per component)
- Global CSS variables defined in a single `variables.css` file imported at the app root
- No CSS framework, no Tailwind, no CSS-in-JS
- No UI component libraries — all components are hand-built

---

## Color System

All colors are defined as CSS variables in `variables.css`. This file is the single source of truth for theming. Changing colors means editing this one file.

### Background

```
--bg-primary: #191919       (app shell, sidebar)
--bg-secondary: #202020     (editor area, content panes)
--bg-tertiary: #2a2a2a      (hover states, selected items, input backgrounds)
--border-color: #333333
```

### Text

```
--text-primary: #f0efed     (main body text)
--text-secondary: #b8b8b8   (labels, metadata, secondary UI)
--text-muted: #8a8a8a       (placeholders, timestamps, disabled states)
```

### Markdown Typography

Used inside the editor and rendered preview areas only.

```
--md-text: #e8e6e3
--md-heading: #faf8f5
--md-link: #78a9ff
--md-code: #d4b483
--md-inline-code-bg: #2c2c2c
--md-blockquote: #9fb5a5
--md-list-marker: #8ab4f8
```

### Accent

```
--accent: #007acc            (VS Code blue — buttons, active states, focus rings, highlights)
--accent-hover: #1a8fe3
```

### Status Colors

```
--status-success: #10b981
--status-warning: #f59e0b
--status-error: #ef4444
```

These are used in the import results summary and any inline validation feedback.

---

## Typography

- Font: system font stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace fallback for code`
- The editor uses a monospace font for plain text mode and a proportional font for markdown rendered preview
- Base font size: 14px
- Line height: 1.6 for reading areas, 1.4 for UI chrome

---

## Layout

### Shell Structure

Three-column layout at the app level:

```
[ Left Sidebar ] [ Main Content Area ] [ (Right Panel — editor only) ]
```

The right panel is not a persistent sidebar. It is a floating overlay toggled from within the editor. It does not affect the layout of the rest of the app.

### Left Sidebar

- Fixed width: 260px
- Background: `--bg-primary`
- Always visible on desktop
- Collapsible via a toggle button (VS Code behavior — collapses to icon rail or fully hides)
- Keyboard shortcut to toggle: `Ctrl+B` (matching VS Code muscle memory)

Sidebar contents, top to bottom:

```
DevNotes                        (app name / logo)

[ + New Note ]                  (primary action button)

[ Search... ]                   (inline search input, also triggered by Ctrl+K)

─────────────────
NOTES
TAGS
IMPORT

─────────────────
Tags
  #kubernetes  (24)
  #fastapi     (17)
  #postgres    (13)
  ...

─────────────────
Recent Notes
  Note title
  Note title
  Note title

─────────────────
AI Workspace     (disabled / grayed out — reserved for future)
```

Navigation items (NOTES, TAGS, IMPORT) are the primary page routes. Tags listed below are clickable filters that navigate to the Notes page pre-filtered by that tag. Recent Notes shows the last 5 modified notes as direct links.

### Main Content Area

- Background: `--bg-secondary`
- Takes remaining width after sidebar
- Changes entirely based on current page
- No persistent header bar — page-level headings and controls live within each page

---

## Global Behaviors

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open global search |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+N` | New note |
| `Ctrl+S` | Save note (in editor) |
| `Ctrl+/` | Toggle editor mode (write / preview / split) |
| `Escape` | Close modal or dismiss overlay |

### Search

Global search (`Ctrl+K`) opens a centered modal overlay. It searches across note titles, note content, and tags simultaneously. Results appear as a list with the matching note title, a short content snippet, and associated tags. Pressing Enter on a result opens the note.

---

## Pages

### 1. Notes Page (default route `/notes`)

This is the homepage. The app opens here on launch.

**Layout:**
- Top bar: page title "Notes", view mode toggle (list / compact / grid), sort control (last modified / created / title)
- Below: full-height scrollable list of note cards

**Note Card (list view):**
- Title (prominent)
- Tags as small inline chips
- Last modified timestamp
- First line of content as a subtitle (truncated)

**Note Card (compact view):**
- Title and timestamp on one line, tags on the next — denser layout for large collections

**Note Card (grid view):**
- Card-style layout, useful for shorter notes. Shows title, tags, and a few lines of content preview.

**Empty state:**
- When no notes exist, show a centered prompt: "No notes yet. Create your first note or import files."

**Filtering:**
- Clicking a tag in the sidebar pre-filters this page to show only notes with that tag
- A visible active filter chip appears at the top of the list when a filter is applied, with an ✕ to clear it

---

### 2. Note Editor (`/notes/:id` and `/notes/new`)

The most important page in the app. This is where the majority of time is spent.

**Layout:**

```
[ Title (large, editable inline) ]
[ Tags  •  Note Type  •  Last Modified  •  [ Outline ] ]
─────────────────────────────────────────────────────
[ Editor Area ]
```

**Title field:**
- Large, plain text input at the top
- Clicking anywhere on it makes it editable
- No border when not focused — looks like a heading

**Metadata bar (below title):**
- Tags: displayed as chips, clicking opens an inline tag picker. Tags can be typed and created on the fly.
- Note Type: small label — "Markdown" or "Plain Text" — based on the note's `note_type` field. Clicking toggles between the two and switches the editor mode accordingly.
- Last Modified: muted timestamp, read-only
- Outline button: opens the outline floating panel (see below)

**Editor implementation: TipTap (headless)**

The editor is built on TipTap in headless mode. No TipTap UI components are used. All toolbar elements, menus, and visual chrome are custom-built React components styled with CSS Modules. TipTap provides the editing engine, document model, extension system, and keyboard shortcuts — nothing else.

Required TipTap extensions:
- `StarterKit` — covers bold, italic, headings (H1–H3), blockquote, code block, bullet list, ordered list, hard break, history (undo/redo)
- `Placeholder` — ghost text in empty editor ("Start writing...")
- `Link` — clickable link support with `href` attribute
- `Highlight` — text highlight support
- `Typography` — smart quotes, em dashes, ellipsis auto-conversion
- `CharacterCount` — optional, useful for the metadata bar

TipTap outputs and stores content as HTML internally (its native document model). For notes stored as markdown in the database, a markdown serializer/deserializer must be used to convert between TipTap's HTML output and raw markdown on save and load. The recommended approach is `@tiptap/pm` with a custom markdown parser, or the community extension `tiptap-markdown` which handles this conversion layer. The planning agent must confirm this approach during implementation.

Plain text notes bypass TipTap entirely and use a plain `<textarea>` element. The `note_type` field on the note determines which editor component is mounted.

**Formatting toolbar:**

A horizontal toolbar sits above the editor area (below the metadata bar). It is visible only for markdown notes. It is custom-built — no TipTap UI components.

Toolbar buttons (in order):
- Bold
- Italic
- Strikethrough
- Inline code
- Heading (H1 / H2 / H3 — a dropdown or three separate buttons)
- Bullet list
- Ordered list
- Blockquote
- Code block
- Link (opens a small inline popover to enter a URL)
- Highlight
- Divider
- Undo / Redo

Each button calls the corresponding TipTap `editor.chain().focus()` command. Active state (e.g., cursor is inside bold text) is reflected by reading `editor.isActive('bold')` and applying an active CSS class to the button.

**Editor keyboard shortcuts (provided by TipTap extensions, no custom implementation needed):**

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+Shift+S` | Strikethrough |
| `Ctrl+E` | Inline code |
| `Ctrl+Shift+H` | Highlight |
| `Ctrl+Shift+7` | Ordered list |
| `Ctrl+Shift+8` | Bullet list |
| `Ctrl+Shift+B` | Blockquote |
| `Ctrl+Alt+C` | Code block |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Tab` | Indent list item |
| `Shift+Tab` | Outdent list item |

These shortcuts are active whenever the editor is focused. They do not need to be registered manually — they are provided by `StarterKit` and the relevant extensions.

Note: `Ctrl+B` conflicts with the global sidebar toggle shortcut. The sidebar shortcut must only fire when the editor is not focused. The implementation must check `editor.isFocused` before acting on `Ctrl+B` at the app level.

**Editor modes:**
Three modes, toggled via `Ctrl+/` or a small segmented control in the top-right of the editor area:

- **Write:** TipTap editor, full width, formatting toolbar visible
- **Preview:** read-only rendered output of the note content, full width, toolbar hidden
- **Split:** TipTap editor on the left, live rendered preview on the right — equal width columns, toolbar visible

Plain text notes always use Write mode (plain `<textarea>`). The mode toggle and formatting toolbar are hidden for plain text note types.

**Outline floating panel:**
- Triggered by the Outline button in the metadata bar
- Appears as an overlay panel anchored to the right side of the editor
- Lists all headings (H1–H3) extracted from the note content
- Clicking a heading scrolls the editor to that position
- Can be dismissed with Escape or by clicking outside

**Auto-save:**
- Notes save automatically after a short debounce period (e.g., 1–2 seconds of inactivity)
- A subtle "Saved" indicator appears in the metadata bar when a save completes
- `Ctrl+S` triggers an immediate save

**New note:**
- `/notes/new` shows an empty editor
- Title defaults to empty with placeholder "Untitled"
- Note type defaults to Markdown
- Note is not persisted until the user types something (title or content)

---

### 3. Tags Page (`/tags`)

A full-page overview of all tags.

**Layout:**
- Page title "Tags"
- Search/filter input to narrow the tag list
- Tag list: each row shows the tag name and note count

```
#kubernetes      24 notes
#fastapi         17 notes
#postgres        13 notes
```

- Clicking a tag navigates to the Notes page filtered by that tag
- Tags are sorted by note count descending by default, with an option to sort alphabetically

**Tag management:**
- Tags are created inline when typing in the note editor's tag field — there is no separate "create tag" flow
- Tags with zero notes are automatically cleaned up by the backend

---

### 4. Import Page (`/import`)

**Purpose:** Bulk import `.md` and `.txt` files from a folder on the local filesystem into the database as notes.

**Layout:**

```
[ Page title: "Import Notes" ]

[ Folder path input field ]        [ Browse... button ]

[ Tags to apply ]                  (tag picker — applies tags to all imported notes)

[ Import button ]

─────────────────
[ Results panel — shown after import ]
```

**Folder path input:**
- Plain text input where the user types or pastes an absolute folder path
- Browse button opens a native OS folder picker dialog (via the browser's file system API or an Electron/webview equivalent depending on deployment)

**Tag assignment:**
- A tag picker field below the folder path input
- The user can add one or more tags before importing
- All notes created by this import will have these tags applied
- Optional — import works without tags

**Import behavior:**
- Scans the specified folder recursively for `.md` and `.txt` files
- Skips files already imported (detected via `source_path` deduplication in the backend)
- Creates one note per file

**Results panel (shown after import completes):**

```
Import complete

  Imported:   132
  Skipped:    18   (already exist)
  Errors:     2

[ View Errors ▾ ]   (expandable list of filenames that failed)
```

Status colors from the color system apply: success green for imported count, muted for skipped, error red for errors.

---

### 5. Search (`Ctrl+K` modal)

Not a standalone page — a modal overlay triggered from anywhere in the app.

**Layout:**
- Centered modal, roughly 600px wide, appears over a dimmed backdrop
- Search input at the top, auto-focused on open
- Results list below, appearing as the user types

**Result item:**
- Note title (bold)
- Matching content snippet with the search term highlighted
- Tags associated with the note

**Behavior:**
- Arrow keys navigate the results list
- Enter opens the selected note
- Escape closes the modal

---

## Component Notes for Implementation

**Tag chips:**
Used in note cards, the note editor metadata bar, the import page, and search results. Should be a single reusable `TagChip` component. Variants: display-only and removable (with ✕).

**Tag picker:**
An inline input that shows a dropdown of existing tags as the user types, with an option to create a new tag if no match exists. Used in the note editor and import page. Should be a single reusable `TagPicker` component.

**Note card:**
Three layout variants (list, compact, grid) controlled by a prop. Used only on the Notes page.

**Editor:**
The markdown editor uses TipTap (headless) with CSS Modules for all styling. The formatting toolbar is a custom React component — no TipTap UI packages. Plain text notes use a plain `<textarea>`. See the Note Editor page section for full extension list, toolbar specification, keyboard shortcuts, and the markdown serialization requirement.

**Modals:**
A generic `Modal` wrapper component handles the backdrop, focus trap, and Escape dismissal. The search overlay and any confirmation dialogs (e.g., delete note) use this wrapper.

---

## What Is Explicitly Out of Scope for v1

- Export functionality (noted as a future addition)
- AI Workspace (sidebar entry reserved but disabled)
- Multi-window or tab support
- Real-time collaboration
- Note versioning / history
- `.pdf`, `.docx`, `.ipynb`, `.rst` import support
- Mobile layout