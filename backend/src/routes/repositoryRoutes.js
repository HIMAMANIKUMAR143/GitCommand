import { Router } from 'express';
import { RepositoryController } from '../controllers/repositoryController.js';
import {
  validateBody,
  createCommitSchema,
  resetSchema,
  createBranchSchema,
  terminalCommandSchema,
  recoverReflogSchema
} from '../validators/validators.js';

const router = Router();

// Repository info
router.get('/', RepositoryController.getRepository);
router.get('/:id', RepositoryController.getRepository);

// Commits & Graph
router.get('/:id/commits', RepositoryController.getCommitGraph);
router.post('/:id/commits', validateBody(createCommitSchema), RepositoryController.createCommit);

// HEAD state
router.get('/:id/head', RepositoryController.getHead);

// Reset operations
router.post('/:id/reset', validateBody(resetSchema), RepositoryController.performReset);
router.post('/:id/reset/undo', RepositoryController.undoLastReset);

// Reflog
router.get('/:id/reflog', RepositoryController.getReflog);
router.post('/:id/reflog/recover', validateBody(recoverReflogSchema), RepositoryController.recoverReflog);

// Reset history / Operations
router.get('/:id/operations', RepositoryController.getResetOperations);

// Branches
router.get('/:id/branches', RepositoryController.getBranches);
router.post('/:id/branches', validateBody(createBranchSchema), RepositoryController.createBranch);
router.post('/:id/branches/:branch/switch', RepositoryController.switchBranch);
router.delete('/:id/branches/:branch', RepositoryController.deleteBranch);

// Terminal simulator
router.post('/:id/terminal', validateBody(terminalCommandSchema), RepositoryController.executeTerminal);

// Reset back to demo 5 commits
router.post('/:id/init-demo', RepositoryController.resetToDemo);

export default router;
