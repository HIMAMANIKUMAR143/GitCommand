import { GitService } from '../services/gitService.js';
import { TerminalService } from '../services/terminalService.js';

export class RepositoryController {
  static async getRepository(req, res, next) {
    try {
      const repoId = req.params.id ? parseInt(req.params.id, 10) : null;
      const repo = await GitService.getRepository(repoId);
      if (!repo) {
        return res.status(404).json({ success: false, error: 'Repository not found' });
      }
      res.json({ success: true, repository: repo });
    } catch (err) {
      next(err);
    }
  }

  static async getCommitGraph(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const data = await GitService.getCommitGraph(repoId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createCommit(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const result = await GitService.createCommit(repoId, req.validatedBody);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getHead(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const head = await GitService.getHeadState(repoId);
      res.json({ success: true, head });
    } catch (err) {
      next(err);
    }
  }

  static async performReset(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const result = await GitService.performReset(repoId, req.validatedBody);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async undoLastReset(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const result = await GitService.undoLastReset(repoId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getReflog(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const reflog = await GitService.getReflog(repoId);
      res.json({ success: true, reflog });
    } catch (err) {
      next(err);
    }
  }

  static async recoverReflog(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const { reflogId } = req.validatedBody;
      const result = await GitService.recoverReflogEntry(repoId, reflogId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getResetOperations(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const operations = await GitService.getResetOperations(repoId);
      res.json({ success: true, operations });
    } catch (err) {
      next(err);
    }
  }

  static async getBranches(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const branches = await GitService.getBranches(repoId);
      res.json({ success: true, branches });
    } catch (err) {
      next(err);
    }
  }

  static async createBranch(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const result = await GitService.createBranch(repoId, req.validatedBody.name);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async switchBranch(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const branchName = req.params.branch;
      const result = await GitService.switchBranch(repoId, branchName);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBranch(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const branchName = req.params.branch;
      const result = await GitService.deleteBranch(repoId, branchName);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async executeTerminal(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const { command } = req.validatedBody;
      const result = await TerminalService.executeCommand(repoId, command);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async resetToDemo(req, res, next) {
    try {
      const repoId = parseInt(req.params.id, 10);
      const result = await GitService.resetToDemo(repoId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
