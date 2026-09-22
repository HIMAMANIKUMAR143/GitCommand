import { query } from '../database/db.js';
import crypto from 'crypto';

export function generateCommitHash(message, parentHash = '') {
  const seed = `${message}-${parentHash}-${Date.now()}-${Math.random()}`;
  return crypto.createHash('sha1').update(seed).digest('hex').substring(0, 7);
}

export class GitService {
  /**
   * Get Repository by ID or default demo repo
   */
  static async getRepository(repoId) {
    let repoRes;
    if (repoId) {
      repoRes = await query('SELECT * FROM repositories WHERE id = $1', [repoId]);
    } else {
      repoRes = await query('SELECT * FROM repositories ORDER BY id ASC LIMIT 1');
    }
    return repoRes.rows[0] || null;
  }

  /**
   * Get current HEAD state for a repository
   */
  static async getHeadState(repoId) {
    const res = await query(
      `SELECT h.*, b.name as branch_name, b.head_commit_id as branch_head_id,
              c.commit_number, c.hash as commit_hash, c.message as commit_message
       FROM head_states h
       LEFT JOIN branches b ON h.current_branch_id = b.id
       LEFT JOIN commits c ON h.current_commit_id = c.id
       WHERE h.repository_id = $1`,
      [repoId]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      repository_id: row.repository_id,
      current_branch_id: row.current_branch_id,
      current_branch_name: row.branch_name || 'detached HEAD',
      current_commit_id: row.current_commit_id,
      commit_number: row.commit_number,
      commit_hash: row.commit_hash,
      commit_message: row.commit_message,
      staged_changes: typeof row.staged_changes === 'string' ? JSON.parse(row.staged_changes) : row.staged_changes || [],
      unstaged_changes: typeof row.unstaged_changes === 'string' ? JSON.parse(row.unstaged_changes) : row.unstaged_changes || [],
      updated_at: row.updated_at
    };
  }

  /**
   * Get commit graph with reachability calculations
   */
  static async getCommitGraph(repoId) {
    const headState = await this.getHeadState(repoId);
    if (!headState) return { commits: [], branches: [], head: null };

    // Get all commits
    const commitsRes = await query(
      `SELECT * FROM commits WHERE repository_id = $1 ORDER BY commit_number ASC, created_at ASC`,
      [repoId]
    );
    const allCommits = commitsRes.rows;

    // Get all branches
    const branchesRes = await query(
      `SELECT b.*, c.hash as head_commit_hash, c.commit_number as head_commit_number
       FROM branches b
       LEFT JOIN commits c ON b.head_commit_id = c.id
       WHERE b.repository_id = $1 ORDER BY b.name ASC`,
      [repoId]
    );
    const branches = branchesRes.rows;

    // Build commit map for parent traversal
    const commitMap = new Map();
    allCommits.forEach(c => commitMap.set(c.id, c));

    // Calculate reachable commits from active branch HEAD
    const reachableFromActiveBranch = new Set();
    let currentId = headState.current_commit_id;
    while (currentId && commitMap.has(currentId)) {
      reachableFromActiveBranch.add(currentId);
      const commit = commitMap.get(currentId);
      currentId = commit.parent_commit_id;
    }

    // Calculate reachable commits from ANY branch (to distinguish unreachable vs dangling)
    const reachableFromAnyBranch = new Set();
    branches.forEach(b => {
      let bCurr = b.head_commit_id;
      while (bCurr && commitMap.has(bCurr)) {
        reachableFromAnyBranch.add(bCurr);
        const c = commitMap.get(bCurr);
        bCurr = c.parent_commit_id;
      }
    });

    // Map branch names pointing directly to each commit
    const commitBranchesMap = new Map();
    branches.forEach(b => {
      if (b.head_commit_id) {
        if (!commitBranchesMap.has(b.head_commit_id)) {
          commitBranchesMap.set(b.head_commit_id, []);
        }
        commitBranchesMap.get(b.head_commit_id).push({
          id: b.id,
          name: b.name,
          is_current: b.id === headState.current_branch_id
        });
      }
    });

    // Annotate commits
    const annotatedCommits = allCommits.map(c => {
      const isReachableActive = reachableFromActiveBranch.has(c.id);
      const isReachableAny = reachableFromAnyBranch.has(c.id);
      const isHead = c.id === headState.current_commit_id;
      const pointingBranches = commitBranchesMap.get(c.id) || [];

      return {
        id: c.id,
        commit_number: c.commit_number,
        hash: c.hash,
        message: c.message,
        author: c.author,
        parent_commit_id: c.parent_commit_id,
        created_at: c.created_at,
        is_head: isHead,
        is_reachable: isReachableActive, // reachable from current branch
        is_dangling: !isReachableAny,    // unreachable from any branch
        branches: pointingBranches
      };
    });

    return {
      commits: annotatedCommits,
      branches,
      head: headState
    };
  }

  /**
   * Create a new commit
   */
  static async createCommit(repoId, { message, author }) {
    if (!message || message.trim() === '') {
      throw new Error('Commit message cannot be empty');
    }

    const headState = await this.getHeadState(repoId);
    if (!headState) throw new Error('Repository HEAD state not found');

    // Get max commit number in repo
    const maxNumRes = await query(
      'SELECT COALESCE(MAX(commit_number), 0) as max_num FROM commits WHERE repository_id = $1',
      [repoId]
    );
    const nextCommitNumber = parseInt(maxNumRes.rows[0].max_num, 10) + 1;

    const parentId = headState.current_commit_id;
    const authorName = author && author.trim() ? author.trim() : 'Developer <dev@example.com>';
    const hash = generateCommitHash(message, headState.commit_hash || '');

    // Insert commit
    const newCommitRes = await query(
      `INSERT INTO commits (repository_id, hash, commit_number, message, author, parent_commit_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [repoId, hash, nextCommitNumber, message.trim(), authorName, parentId]
    );
    const newCommit = newCommitRes.rows[0];

    // Update active branch HEAD
    if (headState.current_branch_id) {
      await query(
        'UPDATE branches SET head_commit_id = $1 WHERE id = $2',
        [newCommit.id, headState.current_branch_id]
      );
    }

    // Clear staged changes since they are now committed
    await query(
      `UPDATE head_states
       SET current_commit_id = $1, staged_changes = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE repository_id = $2`,
      [newCommit.id, repoId]
    );

    // Add reflog entry
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repoId,
        'HEAD@{0}',
        'commit',
        parentId,
        newCommit.id,
        `commit: ${message.trim()}`
      ]
    );

    return {
      commit: newCommit,
      explanation: `Created commit ${newCommit.commit_number} (${newCommit.hash}): "${newCommit.message}". HEAD and branch "${headState.current_branch_name}" now point to this commit.`
    };
  }

  /**
   * Perform Git Reset (--soft, --mixed, --hard)
   */
  static async performReset(repoId, { mode = 'mixed', targetExpression }) {
    const validModes = ['soft', 'mixed', 'hard'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid reset mode "${mode}". Supported modes: ${validModes.join(', ')}`);
    }

    const headState = await this.getHeadState(repoId);
    if (!headState || !headState.current_commit_id) {
      throw new Error('Active HEAD not found');
    }

    const allCommitsRes = await query('SELECT * FROM commits WHERE repository_id = $1', [repoId]);
    const commitMap = new Map();
    allCommitsRes.rows.forEach(c => commitMap.set(c.id, c));

    // Resolve target commit
    let targetCommit = null;
    const currentCommit = commitMap.get(headState.current_commit_id);

    if (!currentCommit) {
      throw new Error('Current commit does not exist in repository');
    }

    // Case 1: HEAD~N expression
    const headTildeRegex = /^HEAD~(\d+)$/i;
    const match = targetExpression ? targetExpression.trim().match(headTildeRegex) : null;

    if (match) {
      const steps = parseInt(match[1], 10);
      if (steps <= 0) {
        throw new Error('HEAD~N steps must be greater than 0');
      }

      let curr = currentCommit;
      for (let i = 0; i < steps; i++) {
        if (!curr.parent_commit_id || !commitMap.has(curr.parent_commit_id)) {
          throw new Error(`Cannot reset ${targetExpression}: reached repository root commit before ${steps} steps`);
        }
        curr = commitMap.get(curr.parent_commit_id);
      }
      targetCommit = curr;
    } else {
      // Case 2: Commit Hash, Commit Number, or Commit ID
      const targetStr = String(targetExpression).trim();
      targetCommit = allCommitsRes.rows.find(c =>
        c.hash.toLowerCase().startsWith(targetStr.toLowerCase()) ||
        String(c.commit_number) === targetStr ||
        String(c.id) === targetStr
      );

      if (!targetCommit) {
        throw new Error(`Target commit "${targetExpression}" not found in this repository`);
      }
    }

    if (targetCommit.id === currentCommit.id) {
      throw new Error(`HEAD is already at commit ${targetCommit.commit_number} (${targetCommit.hash})`);
    }

    // Trace path from current HEAD back to target commit to identify affected commits
    const affectedCommits = [];
    let tracer = currentCommit;
    let reachedTarget = false;

    while (tracer && tracer.id !== targetCommit.id) {
      affectedCommits.push({
        id: tracer.id,
        commit_number: tracer.commit_number,
        hash: tracer.hash,
        message: tracer.message
      });

      if (tracer.parent_commit_id && commitMap.has(tracer.parent_commit_id)) {
        tracer = commitMap.get(tracer.parent_commit_id);
        if (tracer.id === targetCommit.id) {
          reachedTarget = true;
          break;
        }
      } else {
        break;
      }
    }

    // Build changes payload based on affected commits
    const commitChangesPayload = affectedCommits.map(c => ({
      commit_number: c.commit_number,
      hash: c.hash,
      summary: `Changes from commit ${c.commit_number}: "${c.message}"`,
      file: `src/feature_${c.commit_number}.js`
    }));

    // Update staged and unstaged changes based on mode
    let updatedStaged = headState.staged_changes || [];
    let updatedUnstaged = headState.unstaged_changes || [];

    if (mode === 'soft') {
      // --soft: Changes of reset commits remain staged in the index
      updatedStaged = [...commitChangesPayload, ...updatedStaged];
    } else if (mode === 'mixed') {
      // --mixed: Changes of reset commits become unstaged in working tree
      updatedUnstaged = [...commitChangesPayload, ...updatedUnstaged];
      updatedStaged = []; // Index is reset to target commit
    } else if (mode === 'hard') {
      // --hard: Working tree and index are completely wiped clean to match target commit
      updatedStaged = [];
      updatedUnstaged = [];
    }

    // 1. Move active branch pointer
    if (headState.current_branch_id) {
      await query(
        'UPDATE branches SET head_commit_id = $1 WHERE id = $2',
        [targetCommit.id, headState.current_branch_id]
      );
    }

    // 2. Move HEAD state
    await query(
      `UPDATE head_states
       SET current_commit_id = $1, staged_changes = $2, unstaged_changes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE repository_id = $4`,
      [targetCommit.id, JSON.stringify(updatedStaged), JSON.stringify(updatedUnstaged), repoId]
    );

    // 3. Generate detailed explanation
    const affectedNumbers = affectedCommits.map(c => c.commit_number).join(', ');
    let modeExplanation = '';
    if (mode === 'soft') {
      modeExplanation = `Because this is a SOFT reset (--soft), commits ${affectedNumbers} are removed from the active branch history, but their changes are preserved in the STAGING AREA (Index).`;
    } else if (mode === 'mixed') {
      modeExplanation = `Because this is a MIXED reset (--mixed, Git default), commits ${affectedNumbers} are removed from the active branch history and index is reset. Their changes are preserved in the WORKING DIRECTORY as unstaged modifications.`;
    } else if (mode === 'hard') {
      modeExplanation = `Because this is a HARD reset (--hard), commits ${affectedNumbers} are removed from the active branch history, and working tree/index are completely reset to match commit ${targetCommit.commit_number}.`;
    }

    const fullExplanation = [
      `HEAD moved from commit ${currentCommit.commit_number} (${currentCommit.hash}) to commit ${targetCommit.commit_number} (${targetCommit.hash}).`,
      `Branch "${headState.current_branch_name}" now points to commit ${targetCommit.commit_number}.`,
      affectedCommits.length > 0
        ? `Commits ${affectedNumbers} are no longer reachable from the "${headState.current_branch_name}" branch history.`
        : '',
      modeExplanation,
      `Important: Database records for commits ${affectedNumbers} are not destroyed; they exist as dangling/unreachable commits and can be recovered via the Git Reflog.`
    ].filter(Boolean).join('\n\n');

    // 4. Record reset operation
    const resetOpRes = await query(
      `INSERT INTO reset_operations (
         repository_id, branch_id, mode, from_commit_id, to_commit_id, target_expression, affected_commits, explanation
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        repoId,
        headState.current_branch_id,
        mode,
        currentCommit.id,
        targetCommit.id,
        targetExpression,
        JSON.stringify(affectedCommits),
        fullExplanation
      ]
    );

    // 5. Record reflog entry
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repoId,
        'HEAD@{0}',
        'reset',
        currentCommit.id,
        targetCommit.id,
        `reset: moving to ${targetExpression} (--${mode})`
      ]
    );

    return {
      operation: resetOpRes.rows[0],
      before: {
        commit_id: currentCommit.id,
        commit_number: currentCommit.commit_number,
        hash: currentCommit.hash,
        branch: headState.current_branch_name
      },
      after: {
        commit_id: targetCommit.id,
        commit_number: targetCommit.commit_number,
        hash: targetCommit.hash,
        branch: headState.current_branch_name
      },
      affected_commits: affectedCommits,
      mode,
      explanation: fullExplanation
    };
  }

  /**
   * Undo Last Reset operation
   */
  static async undoLastReset(repoId) {
    const lastOpRes = await query(
      `SELECT * FROM reset_operations WHERE repository_id = $1 ORDER BY id DESC LIMIT 1`,
      [repoId]
    );

    if (lastOpRes.rows.length === 0) {
      throw new Error('No previous reset operations found to undo');
    }

    const lastOp = lastOpRes.rows[0];
    const previousCommitId = lastOp.from_commit_id;

    if (!previousCommitId) {
      throw new Error('Original commit from previous reset operation is unavailable');
    }

    const targetCommitRes = await query('SELECT * FROM commits WHERE id = $1', [previousCommitId]);
    if (targetCommitRes.rows.length === 0) {
      throw new Error('Original commit does not exist in repository');
    }
    const targetCommit = targetCommitRes.rows[0];

    const headState = await this.getHeadState(repoId);

    // Restore branch pointer
    if (headState.current_branch_id) {
      await query(
        'UPDATE branches SET head_commit_id = $1 WHERE id = $2',
        [targetCommit.id, headState.current_branch_id]
      );
    }

    // Restore HEAD state
    await query(
      `UPDATE head_states
       SET current_commit_id = $1, staged_changes = '[]'::jsonb, unstaged_changes = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE repository_id = $2`,
      [targetCommit.id, repoId]
    );

    // Record in reflog
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repoId,
        'HEAD@{0}',
        'undo-reset',
        headState.current_commit_id,
        targetCommit.id,
        `undo: restored HEAD to commit ${targetCommit.commit_number} (${targetCommit.hash})`
      ]
    );

    return {
      restored_to_commit: targetCommit,
      explanation: `Successfully recovered! HEAD and branch "${headState.current_branch_name}" have been restored back to commit ${targetCommit.commit_number} (${targetCommit.hash}). Previously unreachable commits are now active again in branch history.`
    };
  }

  /**
   * Get Reflog entries
   */
  static async getReflog(repoId) {
    const res = await query(
      `SELECT r.*,
              c_from.commit_number as from_commit_number, c_from.hash as from_commit_hash,
              c_to.commit_number as to_commit_number, c_to.hash as to_commit_hash
       FROM reflog_entries r
       LEFT JOIN commits c_from ON r.from_commit_id = c_from.id
       LEFT JOIN commits c_to ON r.to_commit_id = c_to.id
       WHERE r.repository_id = $1
       ORDER BY r.id DESC`,
      [repoId]
    );

    // Dynamically assign realistic HEAD@{0}, HEAD@{1}, ... based on recency
    return res.rows.map((row, idx) => ({
      ...row,
      selector: `HEAD@{${idx}}`
    }));
  }

  /**
   * Recover to a specific Reflog entry
   */
  static async recoverReflogEntry(repoId, reflogId) {
    const reflogRes = await query(
      'SELECT * FROM reflog_entries WHERE id = $1 AND repository_id = $2',
      [reflogId, repoId]
    );

    if (reflogRes.rows.length === 0) {
      throw new Error('Reflog entry not found');
    }

    const entry = reflogRes.rows[0];
    const targetCommitId = entry.to_commit_id || entry.from_commit_id;

    if (!targetCommitId) {
      throw new Error('No commit associated with this reflog entry');
    }

    const commitRes = await query('SELECT * FROM commits WHERE id = $1', [targetCommitId]);
    if (commitRes.rows.length === 0) {
      throw new Error('Target commit for recovery does not exist');
    }
    const targetCommit = commitRes.rows[0];

    const headState = await this.getHeadState(repoId);

    // Update branch pointer
    if (headState.current_branch_id) {
      await query(
        'UPDATE branches SET head_commit_id = $1 WHERE id = $2',
        [targetCommit.id, headState.current_branch_id]
      );
    }

    // Update HEAD state
    await query(
      `UPDATE head_states
       SET current_commit_id = $1, staged_changes = '[]'::jsonb, unstaged_changes = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE repository_id = $2`,
      [targetCommit.id, repoId]
    );

    // Add reflog entry
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repoId,
        'HEAD@{0}',
        'recover',
        headState.current_commit_id,
        targetCommit.id,
        `recover: recovered HEAD to ${targetCommit.hash} via reflog`
      ]
    );

    return {
      target_commit: targetCommit,
      explanation: `Recovered HEAD and branch "${headState.current_branch_name}" to commit ${targetCommit.commit_number} (${targetCommit.hash}) via Reflog.`
    };
  }

  /**
   * Get past reset operations
   */
  static async getResetOperations(repoId) {
    const res = await query(
      `SELECT ro.*,
              cf.commit_number as from_num, cf.hash as from_hash,
              ct.commit_number as to_num, ct.hash as to_hash,
              b.name as branch_name
       FROM reset_operations ro
       LEFT JOIN commits cf ON ro.from_commit_id = cf.id
       LEFT JOIN commits ct ON ro.to_commit_id = ct.id
       LEFT JOIN branches b ON ro.branch_id = b.id
       WHERE ro.repository_id = $1
       ORDER BY ro.created_at DESC`,
      [repoId]
    );
    return res.rows;
  }

  /**
   * Branches CRUD
   */
  static async getBranches(repoId) {
    const res = await query(
      `SELECT b.*, c.hash as head_hash, c.commit_number as head_number, c.message as head_message
       FROM branches b
       LEFT JOIN commits c ON b.head_commit_id = c.id
       WHERE b.repository_id = $1
       ORDER BY b.created_at ASC`,
      [repoId]
    );
    return res.rows;
  }

  static async createBranch(repoId, branchName) {
    const cleanName = branchName ? branchName.trim() : '';
    if (!cleanName) throw new Error('Branch name cannot be empty');
    if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(cleanName)) {
      throw new Error('Branch name contains invalid characters');
    }

    const headState = await this.getHeadState(repoId);
    if (!headState) throw new Error('Repository HEAD state not found');

    const existing = await query(
      'SELECT id FROM branches WHERE repository_id = $1 AND name = $2',
      [repoId, cleanName]
    );
    if (existing.rows.length > 0) {
      throw new Error(`A branch named "${cleanName}" already exists`);
    }

    const res = await query(
      `INSERT INTO branches (repository_id, name, head_commit_id, is_default)
       VALUES ($1, $2, $3, false) RETURNING *`,
      [repoId, cleanName, headState.current_commit_id]
    );

    return {
      branch: res.rows[0],
      explanation: `Created branch "${cleanName}" pointing to commit ${headState.commit_number} (${headState.commit_hash}).`
    };
  }

  static async switchBranch(repoId, branchName) {
    const branchRes = await query(
      'SELECT * FROM branches WHERE repository_id = $1 AND name = $2',
      [repoId, branchName]
    );
    if (branchRes.rows.length === 0) {
      throw new Error(`Branch "${branchName}" not found`);
    }
    const branch = branchRes.rows[0];

    const headState = await this.getHeadState(repoId);

    // Update HEAD state to switch branch
    await query(
      `UPDATE head_states
       SET current_branch_id = $1, current_commit_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE repository_id = $3`,
      [branch.id, branch.head_commit_id, repoId]
    );

    // Log to reflog
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repoId,
        'HEAD@{0}',
        'checkout',
        headState.current_commit_id,
        branch.head_commit_id,
        `checkout: moving from ${headState.current_branch_name} to ${branch.name}`
      ]
    );

    return {
      branch,
      explanation: `Switched to branch "${branch.name}". HEAD is now at commit id ${branch.head_commit_id}.`
    };
  }

  static async deleteBranch(repoId, branchName) {
    const headState = await this.getHeadState(repoId);
    if (headState && headState.current_branch_name === branchName) {
      throw new Error(`Cannot delete checked out branch "${branchName}". Switch to another branch first.`);
    }

    const branchRes = await query(
      'SELECT * FROM branches WHERE repository_id = $1 AND name = $2',
      [repoId, branchName]
    );
    if (branchRes.rows.length === 0) {
      throw new Error(`Branch "${branchName}" not found`);
    }

    await query('DELETE FROM branches WHERE id = $1', [branchRes.rows[0].id]);
    return {
      deleted_branch: branchName,
      explanation: `Deleted branch "${branchName}". Commits unique to this branch become dangling if unreferenced.`
    };
  }

  /**
   * Reset Repository to pristine 5-commit demo state
   */
  static async resetToDemo(repoId) {
    // Delete repo content and re-seed
    await query('DELETE FROM reflog_entries WHERE repository_id = $1', [repoId]);
    await query('DELETE FROM reset_operations WHERE repository_id = $1', [repoId]);
    await query('DELETE FROM head_states WHERE repository_id = $1', [repoId]);
    await query('DELETE FROM branches WHERE repository_id = $1', [repoId]);
    await query('DELETE FROM commits WHERE repository_id = $1', [repoId]);

    const commitDefs = [
      { num: 1, msg: 'Initial project', hash: '12ad901', author: 'Linus <linus@gitlab.dev>' },
      { num: 2, msg: 'Add login page', hash: '42bc921', author: 'Linus <linus@gitlab.dev>' },
      { num: 3, msg: 'Add dashboard', hash: '71c92aa', author: 'Linus <linus@gitlab.dev>' },
      { num: 4, msg: 'Add Git reset simulator', hash: 'a83bd12', author: 'Linus <linus@gitlab.dev>' },
      { num: 5, msg: 'Improve UI', hash: 'e91ab23', author: 'Linus <linus@gitlab.dev>' },
    ];

    let parentId = null;
    const created = [];

    for (const def of commitDefs) {
      const cRes = await query(
        `INSERT INTO commits (repository_id, hash, commit_number, message, author, parent_commit_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [repoId, def.hash, def.num, def.msg, def.author, parentId]
      );
      const commit = cRes.rows[0];
      created.push(commit);
      parentId = commit.id;

      await query(
        `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [repoId, `HEAD@{${5 - def.num}}`, 'commit', commit.parent_commit_id, commit.id, `commit: ${def.msg}`]
      );
    }

    const latest = created[created.length - 1];

    const branchRes = await query(
      `INSERT INTO branches (repository_id, name, head_commit_id, is_default)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [repoId, 'main', latest.id]
    );

    await query(
      `INSERT INTO head_states (repository_id, current_branch_id, current_commit_id, staged_changes, unstaged_changes)
       VALUES ($1, $2, $3, '[]'::jsonb, '[]'::jsonb)`,
      [repoId, branchRes.rows[0].id, latest.id]
    );

    return {
      message: 'Repository has been reset to the original 5-commit demo state (1 → 2 → 3 → 4 → 5 HEAD on main).'
    };
  }
}
