import React from 'react';
import { useGit } from '../context/GitContext';
import { GitCommit, User, Calendar, GitBranch, ArrowDownRight, AlertTriangle } from 'lucide-react';

export function CommitDetails() {
  const { selectedCommit, graphData } = useGit();

  if (!selectedCommit) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <GitCommit size={15} />
            <span>Commit Details</span>
          </div>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
          Select a commit node from the graph to inspect details.
        </div>
      </div>
    );
  }

  const isHead = selectedCommit.is_head;
  const isReachable = selectedCommit.is_reachable;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <GitCommit size={15} style={{ color: 'var(--border-accent)' }} />
          <span>Commit Details</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isHead && <span className="badge badge-head">HEAD</span>}
          <span className={`badge ${isReachable ? 'badge-staged' : 'badge-unreachable'}`}>
            {isReachable ? 'Reachable' : 'Unreachable'}
          </span>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Commit Number
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Commit #{selectedCommit.commit_number}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Short Hash
            </span>
            <div className="mono" style={{ fontSize: '14px', color: 'var(--border-accent)', fontWeight: 600 }}>
              {selectedCommit.hash}
            </div>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Message
          </span>
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            marginTop: '4px'
          }}>
            {selectedCommit.message}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <User size={13} />
            <span className="truncate">{selectedCommit.author || 'Developer'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Calendar size={13} />
            <span>{new Date(selectedCommit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {!isReachable && (
          <div style={{
            backgroundColor: 'rgba(210, 153, 34, 0.1)',
            border: '1px solid rgba(210, 153, 34, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--status-warning-text)',
            display: 'flex',
            gap: '8px'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              This commit is <strong>unreachable</strong> from the active branch HEAD. In real Git, unreachable commits are pruned after a grace period (e.g. 30–90 days by git gc), but can be recovered using the Reflog.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
