-- Git Reset Lab PostgreSQL Relational Schema

CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    hash VARCHAR(40) NOT NULL,
    commit_number INTEGER NOT NULL,
    message TEXT NOT NULL,
    author VARCHAR(255) NOT NULL DEFAULT 'Developer <dev@example.com>',
    parent_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_repo_hash UNIQUE(repository_id, hash)
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_repo_branch UNIQUE(repository_id, name)
);

CREATE TABLE IF NOT EXISTS head_states (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,
    current_branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    current_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    staged_changes JSONB DEFAULT '[]'::jsonb,
    unstaged_changes JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reset_operations (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    mode VARCHAR(50) NOT NULL, -- 'soft', 'mixed', 'hard'
    from_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    to_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    target_expression VARCHAR(100) NOT NULL, -- e.g. 'HEAD~2' or 'a81f92c'
    affected_commits JSONB DEFAULT '[]'::jsonb, -- JSON array of commit numbers/hashes removed
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reflog_entries (
    id SERIAL PRIMARY KEY,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    selector VARCHAR(50) NOT NULL, -- e.g. 'HEAD@{0}'
    action VARCHAR(100) NOT NULL, -- 'commit', 'reset', 'checkout', 'recover'
    from_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    to_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_commits_repo ON commits(repository_id);
CREATE INDEX IF NOT EXISTS idx_commits_parent ON commits(parent_commit_id);
CREATE INDEX IF NOT EXISTS idx_branches_repo ON branches(repository_id);
CREATE INDEX IF NOT EXISTS idx_reflog_repo ON reflog_entries(repository_id);
