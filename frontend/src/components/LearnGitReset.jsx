import React, { useState } from 'react';
import { useGit } from '../context/GitContext';
import { BookOpen, CheckCircle, XCircle, ArrowRight, Award, RotateCcw, Lightbulb, Play } from 'lucide-react';

const CHALLENGES = [
  // Beginner Level
  {
    id: 1,
    level: 'Beginner',
    title: 'Moving HEAD back 2 commits',
    scenario: '1 → 2 → 3 → 4 → 5 (HEAD on main)',
    question: 'Which command moves HEAD and the active branch to commit 3 and discards all changes in the working tree?',
    options: [
      { text: 'git reset --hard HEAD~2', correct: true },
      { text: 'git reset --hard HEAD~1', correct: false },
      { text: 'git checkout 3', correct: false },
      { text: 'git push --force', correct: false },
    ],
    explanation: 'HEAD~2 means "2 commits before HEAD". With --hard, Git moves the branch pointer back 2 commits (from 5 to 3) and resets the staging area and working directory to match commit 3.',
    wrongFeedback: 'HEAD~1 would move to commit 4, checkout 3 detaches HEAD without moving the branch pointer, and push --force is a remote command that does not move local HEAD.'
  },
  {
    id: 2,
    level: 'Beginner',
    title: 'Commit Persistence & Safety',
    scenario: '1 → 2 → 3 (HEAD)   [4 and 5 removed from branch]',
    question: 'What actually happens to commits 4 and 5 in the Git database immediately after a hard reset?',
    options: [
      { text: 'They are permanently deleted from disk and cannot be recovered.', correct: false },
      { text: 'They become unreachable/dangling commits, but still exist and can be recovered via reflog.', correct: true },
      { text: 'They are automatically pushed to GitHub.', correct: false },
      { text: 'Git compresses them into commit 3.', correct: false },
    ],
    explanation: 'Git rarely destroys data immediately. Commits 4 and 5 remain in the repository object database as unreachable (dangling) objects until garbage collection (git gc) runs much later, allowing recovery via git reflog!',
    wrongFeedback: 'Git commits are immutable snapshots. When you reset, only the branch pointer moves. The old commit objects remain on disk.'
  },
  {
    id: 3,
    level: 'Beginner',
    title: 'Preserving Staged Changes',
    scenario: '1 → 2 → 3 → 4 → 5 (HEAD)',
    question: 'Which reset mode moves HEAD back but leaves the changes from undone commits in the Staging Area (ready to commit)?',
    options: [
      { text: '--hard', correct: false },
      { text: '--soft', correct: true },
      { text: '--mixed', correct: false },
      { text: '--merge', correct: false },
    ],
    explanation: 'git reset --soft HEAD~N moves HEAD and the branch pointer back, but leaves the index (staging area) and working tree untouched. All changes from the reset commits remain staged!',
    wrongFeedback: '--hard discards changes; --mixed moves changes to unstaged working tree; only --soft keeps them staged.'
  },

  // Intermediate Level
  {
    id: 4,
    level: 'Intermediate',
    title: 'Default Git Reset Behavior',
    scenario: 'You type: git reset HEAD~1 (without flags)',
    question: 'What reset mode does Git apply by default when no flag is provided?',
    options: [
      { text: '--hard (discards all changes)', correct: false },
      { text: '--soft (keeps changes staged)', correct: false },
      { text: '--mixed (resets index, keeps changes unstaged in working tree)', correct: true },
      { text: '--abort (cancels command)', correct: false },
    ],
    explanation: 'By default, git reset uses --mixed. It updates the branch pointer and index to the target commit, leaving modified files unstaged in your working directory.',
    wrongFeedback: 'If you omit the flag, Git defaults to --mixed, which is safer than --hard because it does not erase your work in progress.'
  },
  {
    id: 5,
    level: 'Intermediate',
    title: 'Accidental Reset Recovery',
    scenario: 'You just ran: git reset --hard HEAD~3 by mistake!',
    question: 'What is the most effective Git tool to find the lost commit hash and restore your branch?',
    options: [
      { text: 'git reflog', correct: true },
      { text: 'git log --oneline', correct: false },
      { text: 'git status', correct: false },
      { text: 'git diff', correct: false },
    ],
    explanation: 'git reflog (reference log) records every time HEAD changes position, even across resets and deleted branches. It allows you to find where HEAD was before the reset and restore it!',
    wrongFeedback: 'git log only shows reachable commits in the active branch history, so reset commits will not appear there! You need git reflog.'
  },

  // Advanced Level
  {
    id: 6,
    level: 'Advanced',
    title: 'Understanding Reflog Syntax',
    scenario: 'Output: 71c92aa HEAD@{0}: reset: moving to HEAD~2',
    question: 'In Git reflog notation, what does HEAD@{1} signify?',
    options: [
      { text: 'The 1st commit ever made in the repository.', correct: false },
      { text: 'The state of HEAD immediately before the most recent action (HEAD@{0}).', correct: true },
      { text: 'The parent branch of HEAD.', correct: false },
      { text: 'The remote tracking branch HEAD.', correct: false },
    ],
    explanation: 'Reflog entries are ordered chronologically backwards: HEAD@{0} is right now, HEAD@{1} was the previous state, HEAD@{2} was 2 steps ago, and so on.',
    wrongFeedback: 'HEAD@{n} represents the nth prior position of HEAD in your local repository.'
  },
  {
    id: 7,
    level: 'Advanced',
    title: 'Reset vs Checkout (Detached HEAD)',
    scenario: 'Comparing git reset <commit> vs git checkout <commit>',
    question: 'What is the fundamental architectural difference between git reset <commit> and git checkout <commit>?',
    options: [
      { text: 'There is no difference; they are aliases.', correct: false },
      { text: 'git reset moves the active branch pointer with HEAD; git checkout moves HEAD directly, creating a detached HEAD.', correct: true },
      { text: 'git reset only works on branches, while checkout only works on tags.', correct: false },
      { text: 'git checkout alters git history permanently.', correct: false },
    ],
    explanation: 'When on branch "main", git reset commit_hash moves both HEAD and the "main" branch pointer. In contrast, git checkout commit_hash moves HEAD away from the branch pointer, leaving you in a "detached HEAD" state.',
    wrongFeedback: 'git reset moves branch pointers; git checkout moves HEAD without changing branch pointers.'
  }
];

export function LearnGitReset() {
  const { setActiveTab } = useGit();
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const filteredChallenges = selectedLevel === 'All'
    ? CHALLENGES
    : CHALLENGES.filter(c => c.level === selectedLevel);

  const activeChallenge = filteredChallenges[currentIdx] || filteredChallenges[0];

  const handleOptionSelect = (optionIndex) => {
    if (submitted) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === null || submitted) return;
    setSubmitted(true);
    if (activeChallenge.options[selectedOption].correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    if (currentIdx < filteredChallenges.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCurrentIdx(0);
    }
  };

  const isAnswerCorrect = submitted && selectedOption !== null && activeChallenge.options[selectedOption].correct;

  return (
    <div className="quiz-container">
      {/* Hero */}
      <div className="quiz-hero">
        <div className="quiz-hero-title">
          <BookOpen size={22} style={{ color: 'var(--border-accent)' }} />
          <span>Interactive Git Reset Mastery</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Master Git commits, HEAD navigation, soft/mixed/hard resets, dangling commit mechanics, and reflog recovery through hands-on challenges.
        </p>

        {/* Level Selector */}
        <div className="quiz-level-selector">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
            <button
              key={lvl}
              className={`level-btn ${selectedLevel === lvl ? 'active' : ''}`}
              onClick={() => {
                setSelectedLevel(lvl);
                setCurrentIdx(0);
                setSelectedOption(null);
                setSubmitted(false);
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Card */}
      <div className="quiz-card">
        <div className="quiz-question-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-head" style={{ fontSize: '11px' }}>
              {activeChallenge.level}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeChallenge.title}
            </span>
          </div>

          <span className="quiz-progress-badge">
            Question {currentIdx + 1} of {filteredChallenges.length}
          </span>
        </div>

        {/* Scenario Display */}
        <div className="quiz-scenario">
          <span className="scenario-label">Scenario Context</span>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {activeChallenge.scenario}
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {activeChallenge.question}
        </div>

        {/* Options */}
        <div className="quiz-options-list">
          {activeChallenge.options.map((option, idx) => {
            let optionClass = '';
            if (submitted) {
              if (option.correct) optionClass = 'correct';
              else if (selectedOption === idx) optionClass = 'incorrect';
              else optionClass = 'disabled';
            } else if (selectedOption === idx) {
              optionClass = 'selected';
            }

            return (
              <div
                key={idx}
                className={`quiz-option-item ${optionClass}`}
                onClick={() => handleOptionSelect(idx)}
              >
                <div className="quiz-option-code">
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option.text}</span>
                </div>

                {submitted && option.correct && (
                  <CheckCircle size={16} style={{ color: 'var(--status-success-text)' }} />
                )}
                {submitted && selectedOption === idx && !option.correct && (
                  <XCircle size={16} style={{ color: 'var(--status-danger-text)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation upon submission */}
        {submitted && (
          <div className={`quiz-explanation-box ${isAnswerCorrect ? 'correct' : 'incorrect'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <Lightbulb size={16} />
              <span>{isAnswerCorrect ? 'Correct! Here is why:' : 'Incorrect. Explanation:'}</span>
            </div>
            <div>{activeChallenge.explanation}</div>
            {!isAnswerCorrect && (
              <div style={{ color: 'var(--status-danger-text)', fontSize: '12px', marginTop: '4px' }}>
                Why other options were wrong: {activeChallenge.wrongFeedback}
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="quiz-footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('lab')}
            title="Switch to visualizer lab to try this out"
          >
            <Play size={13} />
            <span>Try in Simulator Lab</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!submitted ? (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={selectedOption === null}
              >
                Submit Answer
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleNext}
              >
                <span>{currentIdx < filteredChallenges.length - 1 ? 'Next Challenge' : 'Restart Level'}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
