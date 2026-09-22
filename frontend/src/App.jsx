import React from 'react';
import { useGit } from './context/GitContext';
import { Header } from './components/Header';
import { CommitGraph } from './components/CommitGraph';
import { ResetPanel } from './components/ResetPanel';
import { CommitDetails } from './components/CommitDetails';
import { WorkingTreeVisualizer } from './components/WorkingTreeVisualizer';
import { ReflogPanel } from './components/ReflogPanel';
import { TerminalSimulator } from './components/TerminalSimulator';
import { ResetComparisonModal } from './components/ResetComparisonModal';
import { CreateCommitModal } from './components/CreateCommitModal';
import { BranchModal } from './components/BranchModal';
import { OperationHistoryModal } from './components/OperationHistoryModal';
import { EducationalBanner } from './components/EducationalBanner';
import { LearnGitReset } from './components/LearnGitReset';
import { Toasts } from './components/Toasts';

export function App() {
  const { activeTab, loading } = useGit();

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <EducationalBanner />

        {activeTab === 'lab' ? (
          <>
            {/* 1. Commit Graph */}
            <CommitGraph />

            {/* 2. Middle Row: Reset Simulator & Commit Details */}
            <div className="dashboard-grid">
              <ResetPanel />
              <CommitDetails />
            </div>

            {/* 3. Working Tree & Staging Visualizer */}
            <WorkingTreeVisualizer />

            {/* 4. Reflog Timeline */}
            <ReflogPanel />

            {/* 5. Terminal Simulator */}
            <TerminalSimulator />
          </>
        ) : (
          /* Interactive Learning Mode */
          <LearnGitReset />
        )}
      </main>

      {/* Modals */}
      <ResetComparisonModal />
      <CreateCommitModal />
      <BranchModal />
      <OperationHistoryModal />

      {/* Toast Notifications */}
      <Toasts />
    </div>
  );
}

export default App;
