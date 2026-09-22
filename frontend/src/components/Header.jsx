import React from 'react';
import { useGit } from '../context/GitContext';
import { GitBranch, GitCommit, RotateCcw, Plus, BookOpen, Layers, History, RefreshCw } from 'lucide-react';

export function Header() {
  const {
    repository,
    graphData,
    activeTab,
    setActiveTab,
    setShowCommitModal,
    setShowBranchModal,
    setShowHistoryModal,
    handleUndoReset,
    handleResetToDemo,
    loading
  } = useGit();

  const head = graphData.head;
  const currentBranchName = head?.current_branch_name || 'main';
  const headCommitNum = head?.commit_number || '?';
  const headHash = head?.commit_hash || '-------';

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-brand">
          <div className="brand-icon">
            <RotateCcw size={18} />
          </div>
          <div>
            <span className="brand-title">Git Reset Lab</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav">
          <button
            className={`nav-btn ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            <Layers size={15} />
            Simulator Lab
          </button>
          <button
            className={`nav-btn ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            <BookOpen size={15} />
            Learn Git Reset
          </button>
        </nav>
      </div>

      <div className="header-right">
        {/* Branch & HEAD indicators */}
        <div className="repo-meta">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBranchModal(true)}
            title="Manage branches"
          >
            <GitBranch size={13} style={{ color: 'var(--git-branch-main)' }} />
            <span>{currentBranchName}</span>
          </button>

          <span className="badge badge-head" title={`Current HEAD: commit ${headCommitNum} (${headHash})`}>
            <span>HEAD → {headCommitNum}</span>
            <span className="mono" style={{ fontSize: '10px', opacity: 0.8 }}>({headHash})</span>
          </span>
        </div>

        {/* Action Buttons */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowCommitModal(true)}
        >
          <Plus size={14} />
          <span>Create Commit</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleUndoReset}
          title="Restore HEAD prior to the most recent git reset"
        >
          <RotateCcw size={13} />
          <span>Undo Reset</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowHistoryModal(true)}
          title="View reset operation audit log"
        >
          <History size={13} />
          <span>History</span>
        </button>

        <button
          className="btn btn-outline-warning btn-sm"
          onClick={handleResetToDemo}
          title="Reset back to initial 5-commit state (1 → 2 → 3 → 4 → 5 HEAD on main)"
        >
          <RefreshCw size={13} />
          <span>Reset to Demo</span>
        </button>
      </div>
    </header>
  );
}
