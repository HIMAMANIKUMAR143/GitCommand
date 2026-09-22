import React, { useState } from 'react';
import { useGit } from '../context/GitContext';
import { GitCommit, Plus } from 'lucide-react';

export function CreateCommitModal() {
  const { showCommitModal, setShowCommitModal, handleCreateCommit } = useGit();
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('Linus <linus@gitlab.dev>');
  const [submitting, setSubmitting] = useState(false);

  if (!showCommitModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      await handleCreateCommit({ message, author });
      setMessage('');
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
            <GitCommit size={18} style={{ color: 'var(--status-success-text)' }} />
            <span>Create New Commit</span>
          </div>
          <button className="modal-close" onClick={() => setShowCommitModal(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Commit Message *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Refactor user authentication logic"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Author (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Developer <dev@example.com>"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              The new commit will become the child of the current HEAD and the active branch pointer will advance automatically.
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCommitModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !message.trim()}
            >
              <Plus size={14} />
              <span>{submitting ? 'Committing...' : 'Commit Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
