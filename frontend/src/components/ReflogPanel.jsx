import React from 'react';
import { useGit } from '../context/GitContext';
import { Clock, RotateCcw, ArrowRight } from 'lucide-react';

export function ReflogPanel() {
  const { reflogList, handleRecoverReflog, loading } = useGit();

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Clock size={15} style={{ color: 'var(--git-branch-feature)' }} />
          <span>Git Reflog (Safety Net & Recovery)</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Select any entry to recover previous state
        </span>
      </div>

      <div className="card-body" style={{ maxHeight: '240px', overflowY: 'auto', padding: '10px' }}>
        {reflogList.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px', padding: '10px' }}>
            Reflog is currently empty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reflogList.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: idx === 0 ? 'rgba(88, 166, 255, 0.06)' : 'var(--bg-surface)',
                  border: `1px solid ${idx === 0 ? 'rgba(88, 166, 255, 0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                  <span className="mono" style={{
                    color: 'var(--border-accent)',
                    fontWeight: 600,
                    minWidth: '70px'
                  }}>
                    {entry.selector}
                  </span>

                  <span className="mono" style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)'
                  }}>
                    {entry.to_commit_hash || entry.from_commit_hash || '-------'}
                  </span>

                  <span className="truncate" style={{ color: 'var(--text-primary)', flex: 1 }}>
                    {entry.message}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRecoverReflog(entry.id)}
                    disabled={loading || idx === 0}
                    title={idx === 0 ? 'HEAD is already at this state' : 'Restore HEAD to this reflog checkpoint'}
                  >
                    <RotateCcw size={11} />
                    <span>Recover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
