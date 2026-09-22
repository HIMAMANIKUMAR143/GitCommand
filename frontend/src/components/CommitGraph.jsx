import React, { useRef, useEffect } from 'react';
import { useGit } from '../context/GitContext';
import { GitBranch, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export function CommitGraph() {
  const { graphData, selectedCommit, setSelectedCommit } = useGit();
  const scrollContainerRef = useRef(null);

  const { commits, head } = graphData;

  // Auto-scroll to HEAD commit on update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [commits, head]);

  const reachableCommits = commits.filter(c => c.is_reachable);
  const unreachableCommits = commits.filter(c => !c.is_reachable);

  return (
    <div className="graph-card">
      <div className="card-header">
        <div className="card-title">
          <span>Commit Graph (DAG)</span>
          <span className="badge badge-branch">
            {head?.current_branch_name || 'main'}
          </span>
        </div>

        <div className="graph-header-actions">
          <div className="graph-legend">
            <div className="legend-item">
              <span className="legend-dot head"></span>
              <span>HEAD</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot reachable"></span>
              <span>Reachable ({reachableCommits.length})</span>
            </div>
            {unreachableCommits.length > 0 && (
              <div className="legend-item">
                <span className="legend-dot unreachable"></span>
                <span>Unreachable / Dangling ({unreachableCommits.length})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="graph-viewport" ref={scrollContainerRef}>
        <div className="graph-canvas">
          {commits.map((commit, index) => {
            const isHead = commit.is_head;
            const isSelected = selectedCommit?.id === commit.id;
            const isReachable = commit.is_reachable;
            const hasNext = index < commits.length - 1;

            return (
              <div key={commit.id} className="node-wrapper">
                {/* HEAD Pointer */}
                {isHead && (
                  <div className="head-pointer-indicator">
                    <span className="head-pointer-tag">HEAD</span>
                    <span className="head-pointer-arrow"></span>
                  </div>
                )}

                {/* Commit Node */}
                <div
                  className={`commit-node ${isReachable ? 'reachable' : 'unreachable'} ${isHead ? 'is-head' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCommit(commit)}
                  title={`Click to inspect or target commit ${commit.commit_number} (${commit.hash})`}
                >
                  <div className="node-top-row">
                    <span className="node-number-badge">
                      {commit.commit_number}
                    </span>
                    <span className="node-hash">
                      {commit.hash}
                    </span>
                  </div>

                  <div className="node-message" title={commit.message}>
                    {commit.message}
                  </div>

                  {!isReachable && (
                    <div className="node-unreachable-tag">
                      <AlertTriangle size={11} />
                      <span>Unreachable</span>
                    </div>
                  )}

                  {/* Branches pointing to this commit */}
                  {commit.branches && commit.branches.length > 0 && (
                    <div className="node-branches">
                      {commit.branches.map(b => (
                        <span key={b.id} className="branch-pointer-tag">
                          <GitBranch size={10} />
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow connector to next commit */}
                {hasNext && (
                  <div className="node-connector">
                    <div
                      className={`connector-line ${isReachable && commits[index + 1].is_reachable ? 'reachable' : 'unreachable'}`}
                    >
                      <div className="connector-arrow"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
