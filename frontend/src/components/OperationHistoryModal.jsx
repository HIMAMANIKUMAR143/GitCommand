import React from 'react';
import { useGit } from '../context/GitContext';
import { History, CheckCircle2, ArrowRight } from 'lucide-react';

export function OperationHistoryModal() {
  const { showHistoryModal, setShowHistoryModal, operations } = useGit();

  if (!showHistoryModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <History size={18} style={{ color: 'var(--border-accent)' }} />
            <span>Reset Operation History (Audit Trail)</span>
          </div>
          <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {operations.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
              No reset operations recorded yet. Perform a git reset to see it logged here.
            </div>
          ) : (
            operations.map((op) => {
              const affected = typeof op.affected_commits === 'string'
                ? JSON.parse(op.affected_commits)
                : op.affected_commits || [];
              const affectedNums = affected.map(a => a.commit_number).join(', ') || 'None';

              return (
                <div
                  key={op.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        git reset --{op.mode} {op.target_expression}
                      </span>
                      <span className="badge badge-branch" style={{ fontSize: '10px' }}>
                        {op.branch_name || 'main'}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(op.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '12px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-app)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>HEAD: </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {op.from_num} → {op.to_num}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Affected commits: </span>
                      <span style={{ color: 'var(--status-warning-text)' }}>
                        {affectedNums}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-success-text)' }}>
                      <CheckCircle2 size={12} />
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
