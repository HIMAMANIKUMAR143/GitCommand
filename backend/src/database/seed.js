import { query } from './db.js';
import crypto from 'crypto';

export function generateShortHash(input) {
  return crypto.createHash('sha1').update(input + Math.random().toString()).digest('hex').substring(0, 7);
}

export async function seedDemoData() {
  const repoName = 'git-reset-demo';

  // Check if demo repo already exists
  const existingRepo = await query('SELECT * FROM repositories WHERE name = $1', [repoName]);
  if (existingRepo.rows.length > 0) {
    return existingRepo.rows[0];
  }

  console.log('🌱 Seeding initial demo repository and 5 commits...');

  // 1. Create Repository
  const repoRes = await query(
    'INSERT INTO repositories (name, description) VALUES ($1, $2) RETURNING *',
    [repoName, 'Interactive Git Reset sandbox and practice repository']
  );
  const repo = repoRes.rows[0];

  // 2. Demo commits definitions
  const commitDefs = [
    { num: 1, msg: 'Initial project', hash: '12ad901', author: 'Linus <linus@gitlab.dev>' },
    { num: 2, msg: 'Add login page', hash: '42bc921', author: 'Linus <linus@gitlab.dev>' },
    { num: 3, msg: 'Add dashboard', hash: '71c92aa', author: 'Linus <linus@gitlab.dev>' },
    { num: 4, msg: 'Add Git reset simulator', hash: 'a83bd12', author: 'Linus <linus@gitlab.dev>' },
    { num: 5, msg: 'Improve UI', hash: 'e91ab23', author: 'Linus <linus@gitlab.dev>' },
  ];

  let parentId = null;
  const createdCommits = [];

  for (const def of commitDefs) {
    const cRes = await query(
      `INSERT INTO commits (repository_id, hash, commit_number, message, author, parent_commit_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [repo.id, def.hash, def.num, def.msg, def.author, parentId]
    );
    const commit = cRes.rows[0];
    createdCommits.push(commit);
    parentId = commit.id;

    // Add reflog entry for initial commit creation
    await query(
      `INSERT INTO reflog_entries (repository_id, selector, action, from_commit_id, to_commit_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        repo.id,
        `HEAD@{${5 - def.num}}`,
        'commit',
        commit.parent_commit_id,
        commit.id,
        `commit: ${def.msg}`
      ]
    );
  }

  const latestCommit = createdCommits[createdCommits.length - 1];

  // 3. Create 'main' branch pointing to commit 5
  const branchRes = await query(
    `INSERT INTO branches (repository_id, name, head_commit_id, is_default)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [repo.id, 'main', latestCommit.id, true]
  );
  const mainBranch = branchRes.rows[0];

  // 4. Create HEAD state pointing to 'main' and commit 5
  await query(
    `INSERT INTO head_states (repository_id, current_branch_id, current_commit_id, staged_changes, unstaged_changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [repo.id, mainBranch.id, latestCommit.id, JSON.stringify([]), JSON.stringify([])]
  );

  console.log('✅ Demo repository seeded with 5 commits on main (HEAD -> 5).');
  return repo;
}
