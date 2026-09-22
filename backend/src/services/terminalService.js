import { GitService } from './gitService.js';

export class TerminalService {
  /**
   * Safe parser and executor for Git commands
   */
  static async executeCommand(repoId, rawCommand) {
    const trimmed = (rawCommand || '').trim();

    if (!trimmed) {
      return { output: '', command: rawCommand };
    }

    if (trimmed === 'clear') {
      return { output: '__CLEAR__', command: rawCommand };
    }

    if (trimmed === 'help') {
      return {
        output: [
          'Supported Git Simulator Commands:',
          '  git status                      - Show working tree and staging status',
          '  git log                         - Show commit history',
          '  git log --oneline               - Show compact commit history',
          '  git branch                      - List branches (* indicates current)',
          '  git branch <name>               - Create a new branch',
          '  git checkout <name>             - Switch to branch',
          '  git checkout -b <name>          - Create and switch to new branch',
          '  git commit -m "<message>"       - Record changes to the repository',
          '  git reset --soft <target>       - Reset HEAD, keep changes staged in index',
          '  git reset --mixed <target>      - Reset HEAD, keep changes unstaged in working tree',
          '  git reset --hard <target>       - Reset HEAD, discard staged & unstaged changes',
          '  git reflog                      - Show reflog history',
          '  clear                           - Clear the terminal screen',
          '  help                            - Show this manual'
        ].join('\n'),
        command: rawCommand
      };
    }

    if (!trimmed.startsWith('git')) {
      return {
        output: `bash: ${trimmed.split(' ')[0]}: command not found. Type "help" for a list of supported commands.`,
        error: true,
        command: rawCommand
      };
    }

    const parts = trimmed.split(/\s+/);
    const subCmd = parts[1];

    try {
      switch (subCmd) {
        case 'status': {
          const head = await GitService.getHeadState(repoId);
          const staged = head.staged_changes || [];
          const unstaged = head.unstaged_changes || [];

          const lines = [
            `On branch ${head.current_branch_name}`,
            `HEAD points to commit ${head.commit_number} (${head.commit_hash})`
          ];

          if (staged.length > 0) {
            lines.push('\nChanges to be committed:');
            lines.push('  (use "git restore --staged <file>..." to unstage)');
            staged.forEach(s => {
              lines.push(`\t\x1b[32mnew file:   ${s.file || 'staged_change'} (${s.summary})\x1b[0m`);
            });
          }

          if (unstaged.length > 0) {
            lines.push('\nChanges not staged for commit:');
            lines.push('  (use "git add <file>..." to update what will be committed)');
            unstaged.forEach(u => {
              lines.push(`\t\x1b[31mmodified:   ${u.file || 'unstaged_change'} (${u.summary})\x1b[0m`);
            });
          }

          if (staged.length === 0 && unstaged.length === 0) {
            lines.push('\nnothing to commit, working tree clean');
          }

          return { output: lines.join('\n'), command: rawCommand };
        }

        case 'log': {
          const isOneline = parts.includes('--oneline');
          const graph = await GitService.getCommitGraph(repoId);
          // Only show reachable commits in git log
          const reachable = graph.commits.filter(c => c.is_reachable).reverse();

          if (reachable.length === 0) {
            return { output: 'No commits in active branch history.', command: rawCommand };
          }

          if (isOneline) {
            const lines = reachable.map(c => {
              const headTag = c.is_head ? ` (HEAD -> ${graph.head.current_branch_name})` : '';
              return `${c.hash}${headTag} ${c.message}`;
            });
            return { output: lines.join('\n'), command: rawCommand };
          } else {
            const lines = reachable.map(c => {
              const headTag = c.is_head ? ` (HEAD -> ${graph.head.current_branch_name})` : '';
              return [
                `commit ${c.hash}${headTag}`,
                `Author: ${c.author}`,
                `Date:   ${new Date(c.created_at).toUTCString()}`,
                '',
                `    ${c.message}`,
                ''
              ].join('\n');
            });
            return { output: lines.join('\n'), command: rawCommand };
          }
        }

        case 'branch': {
          if (parts.length === 2) {
            // git branch (list)
            const branches = await GitService.getBranches(repoId);
            const head = await GitService.getHeadState(repoId);
            const lines = branches.map(b => {
              const isCurrent = b.id === head.current_branch_id;
              return `${isCurrent ? '* \x1b[32m' : '  '}${b.name}${isCurrent ? '\x1b[0m' : ''}`;
            });
            return { output: lines.join('\n'), command: rawCommand };
          } else {
            // git branch <name>
            const branchName = parts[2];
            const res = await GitService.createBranch(repoId, branchName);
            return { output: res.explanation, command: rawCommand, stateChanged: true };
          }
        }

        case 'checkout': {
          if (parts[2] === '-b') {
            const newBranchName = parts[3];
            await GitService.createBranch(repoId, newBranchName);
            const switchRes = await GitService.switchBranch(repoId, newBranchName);
            return {
              output: `Switched to a new branch '${newBranchName}'`,
              command: rawCommand,
              stateChanged: true
            };
          } else {
            const branchName = parts[2];
            const switchRes = await GitService.switchBranch(repoId, branchName);
            return {
              output: `Switched to branch '${branchName}'`,
              command: rawCommand,
              stateChanged: true
            };
          }
        }

        case 'commit': {
          const mIndex = parts.indexOf('-m');
          let message = 'Manual commit';
          if (mIndex !== -1 && parts[mIndex + 1]) {
            // Extract quotes if present
            const fullRest = parts.slice(mIndex + 1).join(' ');
            const match = fullRest.match(/^["']([^"']+)["']/);
            message = match ? match[1] : fullRest;
          }

          const res = await GitService.createCommit(repoId, { message });
          return {
            output: `[${res.commit.hash}] ${res.commit.message}`,
            command: rawCommand,
            stateChanged: true
          };
        }

        case 'reset': {
          let mode = 'mixed'; // Git default
          let target = 'HEAD~1';

          for (let i = 2; i < parts.length; i++) {
            if (parts[i] === '--soft') mode = 'soft';
            else if (parts[i] === '--mixed') mode = 'mixed';
            else if (parts[i] === '--hard') mode = 'hard';
            else target = parts[i];
          }

          const res = await GitService.performReset(repoId, { mode, targetExpression: target });
          let resetOutput = `HEAD is now at ${res.after.hash} commit ${res.after.commit_number}`;
          if (res.affected_commits && res.affected_commits.length > 0) {
            const affectedNums = res.affected_commits.map(c => c.commit_number).join(', ');
            resetOutput += `\nRemoved from branch history: commits ${affectedNums} (now dangling/unreachable).`;
          }
          if (mode === 'soft') {
            resetOutput += `\nChanges preserved in staging area (staged).`;
          } else if (mode === 'mixed') {
            resetOutput += `\nUnstaged changes after reset.`;
          } else if (mode === 'hard') {
            resetOutput += `\nWorking tree and index wiped clean.`;
          }

          return {
            output: resetOutput,
            command: rawCommand,
            stateChanged: true,
            resetDetails: res
          };
        }

        case 'reflog': {
          const reflog = await GitService.getReflog(repoId);
          const lines = reflog.map(r => {
            const hash = r.to_commit_hash || (r.from_commit_hash || '0000000');
            return `${hash} ${r.selector}: ${r.message}`;
          });
          return { output: lines.join('\n'), command: rawCommand };
        }

        default:
          return {
            output: `git: '${subCmd}' is not a supported git command in this simulator. Type "help" for allowed commands.`,
            error: true,
            command: rawCommand
          };
      }
    } catch (err) {
      return {
        output: `fatal: ${err.message}`,
        error: true,
        command: rawCommand
      };
    }
  }
}
