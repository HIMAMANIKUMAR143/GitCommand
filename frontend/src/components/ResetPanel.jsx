import React, { useState, useEffect } from 'react';
import { useGit } from '../context/GitContext';
import { RotateCcw, AlertTriangle, ArrowRight, Info, Check } from 'lucide-react';

export function ResetPanel() {
  const { graphData, selectedCommit, handleReset, loading } = useGit();
  const [mode, setMode] = useState('hard');
  const [targetType, setTargetType] = useState('expression'); // 'expression' or 'hash'
  const [targetExpression, setTargetExpression] = useState('HEAD~2');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync with selected commit if user clicks a commit in the graph
  useEffect(() => {
    if (selectedCommit && graphData.head) {
      if (selectedCommit.id !== graphData.head.current_commit_id) {
        // Calculate difference in commit numbers
        const currentNum = graphData.head.commit_number;
        const targetNum = selectedCommit.commit_number;
        if (currentNum && targetNum && currentNum > targetNum) {
          const diff = currentNum - targetNum;
          setTargetExpression(`HEAD~${diff}`);
        } else {
          setTargetExpression(selectedCommit.hash);
        }
      }
    }
  }, [selectedCommit, graphData.head]);

  const generatedCommand = `git reset --${mode} ${targetExpression}`;

  // Mode explanations
  const modeDetails = {
    soft: {
      title: 'Soft Reset (--soft)',
      desc: 'Moves HEAD and branch pointer. Leaves all changes STAGED in the index. No working files are lost.',
      badgeClass: 'badge-staged',
      accent: 'var(--status-success-text)'
    },
    mixed: {
      title: 'Mixed Reset (--mixed) [Git Default]',
      desc: 'Moves HEAD and branch pointer. Resets index. Changes remain UNSTAGED in your working directory.',
      badgeClass: 'badge-unstaged',
      accent: 'var(--status-warning-text)'
    },
    hard: {
      title: 'Hard Reset (--hard)',
      desc: 'Moves HEAD and branch pointer. Discards all staged and unstaged changes. Working tree matches target commit.',
      badgeClass: 'badge-head',
      accent: 'var(--status-danger-text)'
    }
  };

  const handleConfirmReset = async () => {
    try {
      setSubmitting(true);
      await handleReset({ mode, targetExpression });
      setShowConfirmModal(false);
    } catch (err) {
      // Toast handled by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <RotateCcw size={15} style={{ color: 'var(--git-head)' }} />
          <span>Git Reset Simulator</span>
        </div>
        <span className={`badge ${modeDetails[mode].badgeClass}`}>
          --{mode}
        </span>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Mode Selector */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Reset Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {['soft', 'mixed', 'hard'].map(m => (
              <button
                key={m}
                type="button"
                className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  textTransform: 'capitalize',
                  borderColor: mode === m ? 'var(--border-accent)' : undefined
                }}
                onClick={() => setMode(m)}
              >
                --{m}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {modeDetails[mode].desc}
          </div>
        </div>

        {/* Target Selector */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Target Commit</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            {['HEAD~1', 'HEAD~2', 'HEAD~3'].map(expr => (
              <button
                key={expr}
                type="button"
                className={`btn btn-sm ${targetExpression === expr ? 'btn-secondary' : 'btn-secondary'}`}
                style={{
                  borderColor: targetExpression === expr ? 'var(--border-accent)' : undefined,
                  fontWeight: targetExpression === expr ? '600' : 'normal'
                }}
                onClick={() => setTargetExpression(expr)}
              >
                {expr}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="form-input mono"
            value={targetExpression}
            onChange={(e) => setTargetExpression(e.target.value)}
            placeholder="e.g. HEAD~2 or commit hash (a81f92c)"
          />
        </div>

        {/* Generated Command Box */}
        <div style={{
          backgroundColor: 'var(--bg-code)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--git-branch-main)', fontFamily: 'var(--font-mono)' }}>$</span>
            <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {generatedCommand}
            </span>
          </div>
        </div>

        {/* Execute Button */}
        <button
          className={`btn ${mode === 'hard' ? 'btn-danger' : 'btn-primary'} btn-lg`}
          onClick={() => setShowConfirmModal(true)}
          disabled={loading || submitting}
          style={{ width: '100%', marginTop: '4px' }}
        >
          <RotateCcw size={16} />
          <span>EXECUTE RESET</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title" style={{ color: mode === 'hard' ? 'var(--status-danger-text)' : 'var(--text-primary)' }}>
                <AlertTriangle size={18} />
                <span>Confirm Git Reset</span>
              </div>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '14px', color: 'var(--text-primary)' }}>
                You are about to execute the following Git reset operation:
              </p>

              <div style={{
                backgroundColor: 'var(--bg-code)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                marginBottom: '16px',
                color: 'var(--text-primary)'
              }}>
                $ {generatedCommand}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: 'var(--status-info-text)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>HEAD & Branch Pointer:</strong> Will move to target{' '}
                    <code className="mono">{targetExpression}</code>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: 'var(--status-info-text)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>Working Tree & Staging:</strong> {modeDetails[mode].desc}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: 'var(--status-info-text)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>Safety & Dangling Commits:</strong> Commits will not be deleted from the database. You can recover them anytime with <strong>Undo Last Reset</strong> or <strong>Reflog</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={`btn ${mode === 'hard' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmReset}
                disabled={submitting}
              >
                {submitting ? 'Resetting...' : 'Yes, Proceed with Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
