import React from 'react';
import { useGit } from '../context/GitContext';
import { ArrowRight, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

export function ResetComparisonModal() {
  const { showComparisonModal, setShowComparisonModal, lastResetResult, handleUndoReset } = useGit();

  if (!showComparisonModal || !lastResetResult) return null;

  const { before, after, affected_commits, mode, explanation } = lastResetResult;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <CheckCircle size={18} style={{ color: 'var(--status-success-text)' }} />
            <span>Git Reset Comparison & Analysis</span>
          </div>
          <button className="modal-close" onClick={() => setShowComparisonModal(false)}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Visual State Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '12px',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)'
          }}>
            {/* Before */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Before Reset
              </span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                HEAD → Commit {before.commit_number}
              </div>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                ({before.hash}) on {before.branch}
              </span>
            </div>

            <ArrowRight size={22} style={{ color: 'var(--border-accent)' }} />

            {/* After */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                After Reset (--{mode})
              </span>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--git-head)' }}>
                HEAD → Commit {after.commit_number}
              </div>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                ({after.hash}) on {after.branch}
              </span>
            </div>
          </div>

          {/* Commits removed from branch history */}
          {affected_commits && affected_commits.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(210, 153, 34, 0.08)',
              border: '1px dashed var(--git-commit-unreachable)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--status-warning-text)',
                fontWeight: 600,
                fontSize: '13px',
                marginBottom: '8px'
              }}>
                <AlertTriangle size={15} />
                <span>Removed from Branch History (Now Dangling/Unreachable):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {affected_commits.map(c => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-xs)'
                    }}
                  >
                    <span className="node-number-badge" style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                      {c.commit_number}
                    </span>
                    <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                      {c.hash}
                    </span>
                    <span style={{ flex: 1 }}>{c.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational Explanation */}
          <div style={{
            backgroundColor: 'var(--bg-code)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              💡 What just happened:
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{explanation}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowComparisonModal(false);
              handleUndoReset();
            }}
          >
            <RotateCcw size={14} />
            <span>Undo This Reset</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowComparisonModal(false)}
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>
  );
}
