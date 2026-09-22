import React, { useState, useRef, useEffect } from 'react';
import { useGit } from '../context/GitContext';
import { GitApi } from '../services/api';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2, HelpCircle } from 'lucide-react';

export function TerminalSimulator() {
  const { repository, refreshState } = useGit();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    {
      command: 'git log --oneline',
      output: 'e91ab23 (HEAD -> main) Improve UI\na83bd12 Add Git reset simulator\n71c92aa Add dashboard\n42bc921 Add login page\n12ad901 Initial project'
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandList, setCommandList] = useState(['git log --oneline']);
  const bodyRef = useRef(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleExecute = async (cmdToRun) => {
    const cmd = (cmdToRun || input).trim();
    if (!cmd || !repository) return;

    setInput('');
    setCommandList(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd === 'clear') {
      setHistory([]);
      return;
    }

    try {
      const res = await GitApi.executeTerminalCommand(repository.id, cmd);
      const data = res.data;

      if (data.output === '__CLEAR__') {
        setHistory([]);
        return;
      }

      setHistory(prev => [
        ...prev,
        { command: cmd, output: data.output, error: data.error }
      ]);

      // If command changed repo state, refresh graph & UI
      if (data.stateChanged) {
        await refreshState(repository.id);
      }
    } catch (err) {
      setHistory(prev => [
        ...prev,
        { command: cmd, output: `fatal: ${err.response?.data?.error || err.message}`, error: true }
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(commandList[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandList.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(commandList[nextIdx]);
      }
    }
  };

  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-dot red"></div>
          <div className="terminal-dot yellow"></div>
          <div className="terminal-dot green"></div>
          <div className="terminal-title">
            <TerminalIcon size={13} />
            <span>git-bash: ~/git-reset-demo</span>
          </div>
        </div>

        <div className="terminal-actions">
          {/* Quick Command Suggestions */}
          <button
            className="terminal-btn"
            onClick={() => handleExecute('git status')}
          >
            git status
          </button>
          <button
            className="terminal-btn"
            onClick={() => handleExecute('git log --oneline')}
          >
            git log --oneline
          </button>
          <button
            className="terminal-btn"
            onClick={() => handleExecute('git reset --hard HEAD~2')}
          >
            git reset --hard HEAD~2
          </button>
          <button
            className="terminal-btn"
            onClick={() => handleExecute('help')}
            title="Help"
          >
            <HelpCircle size={12} />
          </button>
          <button
            className="terminal-btn"
            onClick={() => setHistory([])}
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="terminal-body" ref={bodyRef}>
        {history.map((item, idx) => (
          <div key={idx} className="terminal-line">
            <div className="terminal-cmd-entry">
              <span className="terminal-prompt">$</span>
              <span className="terminal-cmd-text">{item.command}</span>
            </div>
            {item.output && (
              <div className={`terminal-output ${item.error ? 'error' : ''}`}>
                {item.output}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="terminal-input-row">
        <span className="terminal-prompt">$</span>
        <input
          type="text"
          className="terminal-input"
          placeholder="Type git command (e.g. git log --oneline, git status, git reset --hard HEAD~2) and hit Enter..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleExecute()}
          style={{ padding: '2px 8px' }}
        >
          <CornerDownLeft size={12} />
        </button>
      </div>
    </div>
  );
}
