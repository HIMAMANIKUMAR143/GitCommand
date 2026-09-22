import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GitApi } from '../services/api';

const GitContext = createContext(null);

export function GitProvider({ children }) {
  const [repository, setRepository] = useState(null);
  const [graphData, setGraphData] = useState({ commits: [], branches: [], head: null });
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [reflogList, setReflogList] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & Panels
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [lastResetResult, setLastResetResult] = useState(null);
  const [latestExplanation, setLatestExplanation] = useState(null);

  // Active view tab: 'lab' or 'learn'
  const [activeTab, setActiveTab] = useState('lab');

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch all current repo state
  const refreshState = useCallback(async (repoId, showToastMsg = null) => {
    try {
      setLoading(true);
      const targetId = repoId || (repository ? repository.id : 1);
      
      const [graphRes, reflogRes, opsRes] = await Promise.all([
        GitApi.getCommitGraph(targetId),
        GitApi.getReflog(targetId),
        GitApi.getOperations(targetId),
      ]);

      setGraphData(graphRes.data.data);
      setReflogList(reflogRes.data.reflog || []);
      setOperations(opsRes.data.operations || []);

      // Auto-select HEAD commit if none or previously selected is no longer relevant
      const headCommitId = graphRes.data.data.head?.current_commit_id;
      const headCommit = graphRes.data.data.commits.find(c => c.id === headCommitId);
      setSelectedCommit(prev => {
        if (!prev) return headCommit;
        const stillExists = graphRes.data.data.commits.find(c => c.id === prev.id);
        return stillExists || headCommit;
      });

      if (showToastMsg) {
        addToast(showToastMsg, 'success');
      }
      setError(null);
    } catch (err) {
      console.error('Error refreshing state:', err);
      setError(err.response?.data?.error || err.message);
      addToast(err.response?.data?.error || 'Failed to sync with repository', 'danger');
    } finally {
      setLoading(false);
    }
  }, [repository, addToast]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const res = await GitApi.getDefaultRepo();
        const repo = res.data.repository;
        setRepository(repo);
        await refreshState(repo.id);
      } catch (err) {
        console.error('Initial repo fetch error:', err);
        setError('Failed to initialize Git repository. Make sure backend is running.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Actions
  const handleCreateCommit = async ({ message, author }) => {
    if (!repository) return;
    try {
      const res = await GitApi.createCommit(repository.id, { message, author });
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, `Created commit ${res.data.commit.commit_number} (${res.data.commit.hash})`);
      setShowCommitModal(false);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleReset = async ({ mode, targetExpression }) => {
    if (!repository) return;
    try {
      const res = await GitApi.performReset(repository.id, { mode, targetExpression });
      setLastResetResult(res.data);
      setLatestExplanation(res.data.explanation);
      setShowComparisonModal(true);
      await refreshState(repository.id, `Executed git reset --${mode} ${targetExpression}`);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleUndoReset = async () => {
    if (!repository) return;
    try {
      const res = await GitApi.undoLastReset(repository.id);
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, 'Undid last reset: HEAD restored');
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleRecoverReflog = async (reflogId) => {
    if (!repository) return;
    try {
      const res = await GitApi.recoverReflog(repository.id, reflogId);
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, `Recovered HEAD via Reflog`);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleCreateBranch = async (name) => {
    if (!repository) return;
    try {
      const res = await GitApi.createBranch(repository.id, name);
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, `Created branch "${name}"`);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleSwitchBranch = async (branchName) => {
    if (!repository) return;
    try {
      const res = await GitApi.switchBranch(repository.id, branchName);
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, `Switched to branch "${branchName}"`);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleDeleteBranch = async (branchName) => {
    if (!repository) return;
    try {
      const res = await GitApi.deleteBranch(repository.id, branchName);
      setLatestExplanation(res.data.explanation);
      await refreshState(repository.id, `Deleted branch "${branchName}"`);
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
      throw err;
    }
  };

  const handleResetToDemo = async () => {
    if (!repository) return;
    try {
      await GitApi.resetToDemo(repository.id);
      setLastResetResult(null);
      setLatestExplanation('Repository reset to initial demo state: 1 → 2 → 3 → 4 → 5 (HEAD on main).');
      await refreshState(repository.id, 'Reset repository to pristine demo state');
    } catch (err) {
      addToast(err.response?.data?.error || err.message, 'danger');
    }
  };

  return (
    <GitContext.Provider
      value={{
        repository,
        graphData,
        selectedCommit,
        setSelectedCommit,
        reflogList,
        operations,
        loading,
        error,
        activeTab,
        setActiveTab,
        toasts,
        addToast,
        removeToast,
        refreshState,
        // Modals & Panels
        showCommitModal,
        setShowCommitModal,
        showBranchModal,
        setShowBranchModal,
        showHistoryModal,
        setShowHistoryModal,
        showComparisonModal,
        setShowComparisonModal,
        lastResetResult,
        latestExplanation,
        setLatestExplanation,
        // Action Handlers
        handleCreateCommit,
        handleReset,
        handleUndoReset,
        handleRecoverReflog,
        handleCreateBranch,
        handleSwitchBranch,
        handleDeleteBranch,
        handleResetToDemo,
      }}
    >
      {children}
    </GitContext.Provider>
  );
}

export function useGit() {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useGit must be used within a GitProvider');
  }
  return context;
}
