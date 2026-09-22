# 🔄 Git Reset Lab

> **A Production-Quality Full-Stack Git Reset Visualization & Practice Platform**  
> Visually explore, master, and practice Git commits, `HEAD` movements, branches, dangling commits, reflog recovery, and `git reset` (`--soft`, `--mixed`, `--hard`).

---

## 📖 1. Project Overview

Understanding what happens during a Git reset—especially commands like `git reset --hard HEAD~2`—can be confusing for developers. Many fear losing code or misunderstand the difference between the **Commit Graph**, the **Index (Staging Area)**, and the **Working Directory**.

**Git Reset Lab** provides an interactive, developer-grade visual simulator and learning environment that models Git's Directed Acyclic Graph (DAG) faithfully:

```text
Before reset:
┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
│  1  │ ──► │  2  │ ──► │  3  │ ──► │  4  │ ──► │  5  │ (HEAD -> main)
└─────┘     └─────┘     └─────┘     └─────┘     └─────┘

git reset --hard HEAD~2

After reset:
┌─────┐     ┌─────┐     ┌─────┐     ┌ - - ┐     ┌ - - ┐
│  1  │ ──► │  2  │ ──► │  3  │     ┆  4  ┆     ┆  5  ┆  (Unreachable / Dangling)
└─────┘     └─────┘     └─────┘     └ - - ┘     └ - - ┘
                           ▲
                      HEAD -> main
```

Commits `4` and `5` are **not destroyed**; they remain in the database as unreachable/dangling commits that can be recovered at any time via the **Git Reflog** or **Undo Last Reset**!

---

## ✨ 2. Key Features

- **Interactive Dynamic Commit Graph (DAG)**:
  - Visual nodes connected by directional arrows (`1 → 2 → 3 → 4 → 5`).
  - Realistic 7-character commit hashes (e.g., `a81f92c`).
  - HEAD indicator with glowing animation.
  - Branch pointers (`main`, feature branches).
  - Clear visual distinction: **Reachable Commits** (solid borders) vs. **Unreachable / Dangling Commits** (dashed border, warning tag).
  - Click any commit to inspect metadata or set as reset target.
- **Git Reset Simulator**:
  - Choose between `--soft`, `--mixed` (Git default), and `--hard`.
  - Specify targets via `HEAD~1`, `HEAD~2`, `HEAD~N`, or commit hashes.
  - Live command generator preview (`$ git reset --hard HEAD~2`).
  - Pre-flight confirmation modal with clear impact breakdown.
- **Reset Comparison & Analysis**:
  - Detailed Before vs. After comparison side-by-side.
  - Shows exactly which commits were removed from active branch history.
  - Explains staging area and working directory effects.
- **Three-Tree Architecture Visualizer**:
  - **HEAD**: Active commit reference.
  - **Index (Staging Area)**: Populated during `--soft` resets.
  - **Working Tree**: Populated during `--mixed` resets.
  - Cleaned during `--hard` resets.
- **Git Reflog & Undo Recovery**:
  - Chronological reflog (`HEAD@{0}`, `HEAD@{1}`, `HEAD@{2}`).
  - Instant **Undo Last Reset** button.
  - One-click recovery from any historical reflog checkpoint.
- **Safe Developer Terminal Simulator**:
  - Real bash-like prompt with command history (Up/Down arrow keys).
  - Safe backend parser for `git log`, `git log --oneline`, `git status`, `git branch`, `git reset`, `git reflog`, and `git commit`.
- **Branch Management**:
  - Create, switch, and delete branches.
  - Displays branch head commit associations.
- **Interactive "Learn Git Reset" Quiz**:
  - Categorized into **Beginner**, **Intermediate**, and **Advanced** levels.
  - Instant explanations for right and wrong answers.
  - "Try in Simulator Lab" shortcut.

---

## 🛠️ 3. Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Custom CSS Design System (**NO Tailwind CSS**). Built with CSS Variables, Flexbox, CSS Grid, and custom animations inspired by GitHub, GitKraken, and Linear.
- **Icons**: Lucide React
- **API Client**: Axios

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Validation**: Zod
- **Database**: PostgreSQL (via `pg` connection pool with automatic embedded `pg-mem` in-memory PostgreSQL engine fallback when local PostgreSQL is not running)
- **Security**: Safe command parser, sanitized inputs, parameterized SQL queries, CORS headers.

---

## 📁 4. Project Structure

```text
GitCommandTracker/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── repositoryController.js   # Request handlers
│   │   ├── services/
│   │   │   ├── gitService.js             # Core Git DAG & Reset engine
│   │   │   └── terminalService.js        # Safe terminal parser
│   │   ├── database/
│   │   │   ├── db.js                     # PostgreSQL pool & in-memory fallback
│   │   │   ├── schema.sql                # Relational PostgreSQL schema
│   │   │   └── seed.js                   # 5-commit initial demo seeder
│   │   ├── validators/
│   │   │   └── validators.js             # Zod input validation schemas
│   │   ├── middleware/
│   │   │   └── errorHandler.js           # Central error middleware
│   │   └── app.js                        # Express server entrypoint
│   ├── tests/
│   │   └── gitService.test.js            # Automated backend test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                # Brand, branches, HEAD status, actions
│   │   │   ├── CommitGraph.jsx           # SVG-assisted interactive DAG
│   │   │   ├── ResetPanel.jsx            # Reset controls & confirmation
│   │   │   ├── ResetComparisonModal.jsx  # Before/After comparison
│   │   │   ├── CommitDetails.jsx         # Commit inspector card
│   │   │   ├── WorkingTreeVisualizer.jsx # Index & working tree status
│   │   │   ├── ReflogPanel.jsx           # Reflog list & recovery
│   │   │   ├── TerminalSimulator.jsx     # Safe terminal sandbox
│   │   │   ├── CreateCommitModal.jsx     # New commit creator
│   │   │   ├── BranchModal.jsx           # Branch switcher & creator
│   │   │   ├── OperationHistoryModal.jsx # Audit trail of past resets
│   │   │   ├── EducationalBanner.jsx     # Dynamic Git concepts explainer
│   │   │   ├── LearnGitReset.jsx         # Interactive quiz challenges
│   │   │   └── Toasts.jsx                # Notification toasts
│   │   ├── context/
│   │   │   └── GitContext.jsx            # Global state & API actions
│   │   ├── services/
│   │   │   └── api.js                    # Axios API service
│   │   ├── styles/
│   │   │   ├── variables.css             # Theme design tokens
│   │   │   ├── base.css                  # Typography, utilities, resets
│   │   │   ├── components.css            # Buttons, modals, cards, badges
│   │   │   ├── graph.css                 # Commit nodes & DAG layout
│   │   │   ├── terminal.css              # Terminal console window
│   │   │   └── quiz.css                  # Challenge cards & radios
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml                    # PostgreSQL 16 Alpine container
├── package.json                          # Root orchestration
└── README.md
```

---

## 🗄️ 5. Database Schema & Architecture

The PostgreSQL schema (`backend/src/database/schema.sql`) implements a clean relational model:

- `repositories`: `id`, `name`, `description`, `created_at`
- `commits`: `id`, `repository_id`, `hash` (7-char), `commit_number`, `message`, `author`, `parent_commit_id`, `created_at`
- `branches`: `id`, `repository_id`, `name`, `head_commit_id`, `is_default`, `created_at`
- `head_states`: `id`, `repository_id`, `current_branch_id`, `current_commit_id`, `staged_changes` (JSONB), `unstaged_changes` (JSONB), `updated_at`
- `reset_operations`: `id`, `repository_id`, `branch_id`, `mode`, `from_commit_id`, `to_commit_id`, `target_expression`, `affected_commits` (JSONB), `explanation`, `created_at`
- `reflog_entries`: `id`, `repository_id`, `selector`, `action`, `from_commit_id`, `to_commit_id`, `message`, `created_at`

> **Zero-Friction Local Run**: If you do not have a live PostgreSQL daemon running on port 5432, the backend automatically boots an embedded in-memory PostgreSQL engine (`pg-mem`) executing the exact same SQL schema, ensuring `npm run dev` works immediately without configuration!

---

## ⚙️ 6. Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5000
NODE_ENV=development
# Live PostgreSQL connection (Optional):
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/git_reset_lab
```

---

## 🚀 7. Installation & Running

### Option A: Run Full-Stack with Single Command (Recommended)

1. Clone or open the repository.
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Start both backend and frontend concurrently:
   ```bash
   npm run dev
   ```
   - Frontend will open at: `http://localhost:5173`
   - Backend API will run at: `http://localhost:5000`

---

### Option B: Run Backend and Frontend Separately

#### Backend:
```bash
cd backend
npm install
npm run dev
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

### Option C: Run PostgreSQL via Docker Compose (Optional)

If you wish to use a live PostgreSQL container instead of the embedded engine:
```bash
docker-compose up -d
```
Then start the backend. It will detect the live PostgreSQL server and connect automatically.

---

## 🧪 8. Automated Tests

Run the backend test suite verifying DAG traversal, reset behaviors, reflog, and terminal commands:
```bash
npm run test
```

---

## 📡 9. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck & DB engine status |
| `GET` | `/api/repositories/:id` | Get repository details |
| `GET` | `/api/repositories/:id/commits` | Get commit DAG, reachability flags, and HEAD |
| `POST` | `/api/repositories/:id/commits` | Create new commit (`{ message, author }`) |
| `GET` | `/api/repositories/:id/head` | Get active HEAD, branch, and staged/unstaged files |
| `POST` | `/api/repositories/:id/reset` | Execute reset (`{ mode: "soft"\|"mixed"\|"hard", targetExpression: "HEAD~N"\|hash }`) |
| `POST` | `/api/repositories/:id/reset/undo` | Undo the last reset operation |
| `GET` | `/api/repositories/:id/reflog` | Get chronological reflog entries (`HEAD@{0}`, etc.) |
| `POST` | `/api/repositories/:id/reflog/recover` | Recover HEAD to specific reflog entry ID |
| `GET` | `/api/repositories/:id/operations` | Get audit log of past reset operations |
| `GET` | `/api/repositories/:id/branches` | List all branches |
| `POST` | `/api/repositories/:id/branches` | Create new branch (`{ name }`) |
| `POST` | `/api/repositories/:id/branches/:branch/switch` | Switch active branch |
| `DELETE` | `/api/repositories/:id/branches/:branch` | Delete branch |
| `POST` | `/api/repositories/:id/terminal` | Execute safe terminal command (`{ command }`) |
| `POST` | `/api/repositories/:id/init-demo` | Reset repo to original 5-commit demo state |

---

## 💡 10. Example Git Reset Workflows

### Workflow 1: Hard Reset (`git reset --hard HEAD~2`)
1. Initial state: Commits `1 → 2 → 3 → 4 → 5 (HEAD)` on `main`.
2. Select **Hard** mode and **HEAD~2** target in the Git Reset panel.
3. Click **EXECUTE RESET** and confirm.
4. HEAD moves to **Commit 3**.
5. Commits `4` and `5` remain in the graph with **dashed borders and "Unreachable" badges**.
6. Staged and unstaged working trees are clean.

### Workflow 2: Soft Reset (`git reset --soft HEAD~1`)
1. From Commit 5, select **Soft** mode and target **HEAD~1**.
2. Click **EXECUTE RESET**.
3. HEAD moves to **Commit 4**.
4. Commit 5 changes appear in the **Staging Area (Index)** ready to be recommitted.

### Workflow 3: Undoing a Reset via Reflog
1. After any reset, click the **Undo Reset** button in the header.
2. Alternatively, view the **Git Reflog** panel and click **Recover** on any entry.
3. HEAD and the active branch pointer instantly jump back to the chosen commit, restoring the commits to the active history!

---

## 🔒 11. Security & Safety

- No arbitrary system or shell commands are ever executed on the host OS.
- The terminal simulator uses a whitelist-based safe command parser.
- SQL inputs are strictly parameterized or managed via relational models.
- All endpoints validate inputs using Zod schemas.
