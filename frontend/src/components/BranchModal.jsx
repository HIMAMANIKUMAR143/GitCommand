import React, { useState } from 'react';
import { useGit } from '../context/GitContext';
import { GitBranch, Plus, Check, Trash2 } from 'lucide-react';

export function BranchModal() {
  const {
    showBranchModal,
    setShowBranchModal,
    graphData,
    handleCreateBranch,
    handleSwitchBranch,
    handleDeleteBranch,
    loading
  } = useGit();

  const [newBranchName, setNewBranchName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!showBranchModal) return null;

  const { branches, head } = graphData;
  const currentBranchId = head?.current_branch_id;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      setSubmitting(true);
      await handleCreateBranch(newBranchName.trim());
      setNewBranchName('');
    } catch (err) {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title">
            <GitBranch size={18} style={{ color: 'var(--git-branch-main)' }} />
            <span>Manage Branches</span>
          </div>
          <button className="modal-close" onClick={() => setShowBranchModal(false)}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Create Branch Form */}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="New branch name (e.g. feature-login)"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newBranchName.trim()}
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </form>

          {/* Branch List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Existing Branches:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {branches.map(b => {
                const isCurrent = b.id === currentBranchId;

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: isCurrent ? 'rgba(63, 185, 80, 0.08)' : 'var(--bg-surface)',
                      border: `1px solid ${isCurrent ? 'rgba(63, 185, 80, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch
                        size={14}
                        style={{ color: isCurrent ? 'var(--git-branch-main)' : 'var(--text-muted)' }}
                      />
                      <span style={{
                        fontWeight: isCurrent ? 600 : 'normal',
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        {b.name}
                      </span>
                      {isCurrent && (
                        <span className="badge badge-branch" style={{ fontSize: '10px' }}>
                          current
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isCurrent && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSwitchBranch(b.name)}
                            disabled={loading}
                          >
                            Switch
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteBranch(b.name)}
                            disabled={loading}
                            title="Delete branch"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowBranchModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
