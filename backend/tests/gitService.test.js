import assert from 'assert';
import { getDbPool } from '../src/database/db.js';
import { seedDemoData } from '../src/database/seed.js';
import { GitService } from '../src/services/gitService.js';
import { TerminalService } from '../src/services/terminalService.js';

async function runTests() {
  console.log('🧪 Starting Git Reset Engine Tests...\n');

  // Initialize DB and Demo data
  await getDbPool();
  const repo = await seedDemoData();
  const repoId = repo.id;

  // Test 1: Initial state has 5 commits with HEAD at 5 on main
  console.log('Test 1: Verify Initial Demo State (1 -> 2 -> 3 -> 4 -> 5 HEAD)');
  let graph = await GitService.getCommitGraph(repoId);
  assert.strictEqual(graph.commits.length, 5, 'Should have 5 initial commits');
  assert.strictEqual(graph.head.commit_number, 5, 'HEAD should point to commit 5');
  assert.strictEqual(graph.head.current_branch_name, 'main', 'Active branch should be main');
  assert.strictEqual(graph.commits.every(c => c.is_reachable), true, 'All initial commits must be reachable');
  console.log('  ✅ Test 1 Passed: 5 commits, HEAD -> 5, all reachable.\n');

  // Test 2: git reset --hard HEAD~2
  console.log('Test 2: Perform git reset --hard HEAD~2');
  const hardResetRes = await GitService.performReset(repoId, {
    mode: 'hard',
    targetExpression: 'HEAD~2'
  });
  assert.strictEqual(hardResetRes.before.commit_number, 5, 'Old HEAD should be 5');
  assert.strictEqual(hardResetRes.after.commit_number, 3, 'New HEAD should be 3');
  assert.strictEqual(hardResetRes.affected_commits.length, 2, 'Two commits should be affected (4 and 5)');

  // Verify graph reachability
  graph = await GitService.getCommitGraph(repoId);
  assert.strictEqual(graph.head.commit_number, 3, 'HEAD in graph must be 3');
  const reachableCommits = graph.commits.filter(c => c.is_reachable);
  const unreachableCommits = graph.commits.filter(c => !c.is_reachable);
  assert.strictEqual(reachableCommits.length, 3, 'Reachable commits must be 3 (1, 2, 3)');
  assert.strictEqual(unreachableCommits.length, 2, 'Unreachable commits must be 2 (4, 5)');
  assert.strictEqual(graph.commits.length, 5, 'Commits 4 and 5 must NOT be destroyed from DB');
  console.log('  ✅ Test 2 Passed: HEAD -> 3. Commits 4 & 5 remain in DB but are unreachable.\n');

  // Test 3: Undo Last Reset
  console.log('Test 3: Undo Last Reset (Recovery to commit 5)');
  const undoRes = await GitService.undoLastReset(repoId);
  assert.strictEqual(undoRes.restored_to_commit.commit_number, 5, 'Should restore HEAD to 5');
  graph = await GitService.getCommitGraph(repoId);
  assert.strictEqual(graph.head.commit_number, 5, 'HEAD restored to commit 5');
  assert.strictEqual(graph.commits.every(c => c.is_reachable), true, 'All commits reachable again');
  console.log('  ✅ Test 3 Passed: HEAD restored to 5 via undo.\n');

  // Test 4: git reset --soft HEAD~1
  console.log('Test 4: Perform git reset --soft HEAD~1 (staged changes preserved)');
  const softResetRes = await GitService.performReset(repoId, {
    mode: 'soft',
    targetExpression: 'HEAD~1'
  });
  const headAfterSoft = await GitService.getHeadState(repoId);
  assert.strictEqual(headAfterSoft.commit_number, 4, 'HEAD should be at commit 4');
  assert.strictEqual(headAfterSoft.staged_changes.length > 0, true, 'Changes from commit 5 should be staged');
  console.log('  ✅ Test 4 Passed: Commit 5 changes moved to staging area.\n');

  // Test 5: git reset --mixed HEAD~1
  console.log('Test 5: Perform git reset --mixed HEAD~1 (unstaged changes preserved)');
  const mixedResetRes = await GitService.performReset(repoId, {
    mode: 'mixed',
    targetExpression: 'HEAD~1'
  });
  const headAfterMixed = await GitService.getHeadState(repoId);
  assert.strictEqual(headAfterMixed.commit_number, 3, 'HEAD should be at commit 3');
  assert.strictEqual(headAfterMixed.staged_changes.length, 0, 'Staged changes should be cleared');
  assert.strictEqual(headAfterMixed.unstaged_changes.length > 0, true, 'Changes should be in working tree (unstaged)');
  console.log('  ✅ Test 5 Passed: Changes moved to unstaged working tree.\n');

  // Test 6: Terminal simulator
  console.log('Test 6: Terminal Simulator Commands');
  const logOutput = await TerminalService.executeCommand(repoId, 'git log --oneline');
  assert.strictEqual(logOutput.error, undefined, 'git log should succeed');
  assert.strictEqual(logOutput.output.includes('71c92aa'), true, 'Should include commit 3 hash');

  const statusOutput = await TerminalService.executeCommand(repoId, 'git status');
  assert.strictEqual(statusOutput.output.includes('Changes not staged for commit:'), true, 'git status should show unstaged');
  console.log('  ✅ Test 6 Passed: Terminal outputs correct git log and git status.\n');

  // Reset to original demo
  await GitService.resetToDemo(repoId);
  console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
