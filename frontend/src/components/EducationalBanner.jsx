import React from 'react';
import { useGit } from '../context/GitContext';
import { Sparkles, Info, X } from 'lucide-react';

export function EducationalBanner() {
  const { latestExplanation, setLatestExplanation } = useGit();

  if (!latestExplanation) return null;

  return (
    <div className="explanation-banner">
      <Sparkles size={18} className="banner-icon" />
      <div className="banner-text">
        <div className="banner-title">Git Mechanics & Concepts Explained</div>
        <div className="banner-desc">{latestExplanation}</div>
      </div>
      <button
        className="modal-close"
        onClick={() => setLatestExplanation(null)}
        title="Dismiss explanation"
      >
        <X size={14} />
      </button>
    </div>
  );
}
