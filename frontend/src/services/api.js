import axios from 'axios';

const api = axios.create({
  baseURL: '/api/repositories',
  timeout: 10000,
});

export const GitApi = {
  // Repository
  getDefaultRepo: () => api.get('/'),
  getRepoById: (id) => api.get(`/${id}`),

  // Commits & Graph
  getCommitGraph: (repoId) => api.get(`/${repoId}/commits`),
  createCommit: (repoId, { message, author }) => api.post(`/${repoId}/commits`, { message, author }),

  // HEAD
  getHead: (repoId) => api.get(`/${repoId}/head`),

  // Reset operations
  performReset: (repoId, { mode, targetExpression }) => api.post(`/${repoId}/reset`, { mode, targetExpression }),
  undoLastReset: (repoId) => api.post(`/${repoId}/reset/undo`),

  // Reflog
  getReflog: (repoId) => api.get(`/${repoId}/reflog`),
  recoverReflog: (repoId, reflogId) => api.post(`/${repoId}/reflog/recover`, { reflogId }),

  // Operations
  getOperations: (repoId) => api.get(`/${repoId}/operations`),

  // Branches
  getBranches: (repoId) => api.get(`/${repoId}/branches`),
  createBranch: (repoId, name) => api.post(`/${repoId}/branches`, { name }),
  switchBranch: (repoId, branchName) => api.post(`/${repoId}/branches/${encodeURIComponent(branchName)}/switch`),
  deleteBranch: (repoId, branchName) => api.delete(`/${repoId}/branches/${encodeURIComponent(branchName)}`),

  // Terminal
  executeTerminalCommand: (repoId, command) => api.post(`/${repoId}/terminal`, { command }),

  // Reset to original demo
  resetToDemo: (repoId) => api.post(`/${repoId}/init-demo`),
};

export default api;
