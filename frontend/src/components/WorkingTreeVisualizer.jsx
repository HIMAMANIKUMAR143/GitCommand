import React from 'react';
import { useGit } from '../context/GitContext';
import { FileCode, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function WorkingTreeVisualizer() {
  const { graphData } = useGit();
  const head = graphData.head;

  const staged = head?.staged_changes || [];
  const unstaged = head?.unstaged_changes || [];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <FileCode size={15} style={{ color: 'var(--border-accent)' }} />
          <span>Working Tree & Staging State (Index)</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {staged.length > 0 && (
            <span className="badge badge-staged">{staged.length} Staged</span>
          )}
          {unstaged.length > 0 && (
            <span className="badge badge-unstaged">{unstaged.length} Unstaged</span>
          )}
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Staged Changes Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-staged)' }}>
              Staged Changes (Index / Ready to Commit):
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Result of <code>--soft</code> reset or <code>git add</code>
            </span>
          </div>

          {staged.length === 0 ? (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xs)'
            }}>
              No staged changes in index.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {staged.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(63, 185, 80, 0.08)',
                    border: '1px solid rgba(63, 185, 80, 0.25)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px'
                  }}
                >
                  <span className="badge badge-staged" style={{ fontSize: '10px' }}>staged</span>
                  <span className="mono" style={{ color: 'var(--status-staged)' }}>{item.file}</span>
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unstaged Changes Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-unstaged)' }}>
              Unstaged Changes (Working Directory):
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Result of <code>--mixed</code> reset
            </span>
          </div>

          {unstaged.length === 0 ? (
            <div style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xs)'
            }}>
              Working tree clean (no modified files).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {unstaged.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(240, 136, 62, 0.08)',
                    border: '1px solid rgba(240, 136, 62, 0.25)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px'
                  }}
                >
                  <span className="badge badge-unstaged" style={{ fontSize: '10px' }}>unstaged</span>
                  <span className="mono" style={{ color: 'var(--status-unstaged)' }}>{item.file}</span>
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
