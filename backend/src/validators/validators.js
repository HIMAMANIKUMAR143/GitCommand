import { z } from 'zod';

export const createCommitSchema = z.object({
  message: z.string().min(1, 'Commit message is required').max(500, 'Commit message too long'),
  author: z.string().max(255).optional(),
});

export const resetSchema = z.object({
  mode: z.enum(['soft', 'mixed', 'hard'], {
    errorMap: () => ({ message: 'Mode must be one of: soft, mixed, hard' }),
  }),
  targetExpression: z.string().min(1, 'Target expression is required (e.g. HEAD~1 or commit hash)'),
});

export const createBranchSchema = z.object({
  name: z.string()
    .min(1, 'Branch name is required')
    .max(100, 'Branch name too long')
    .regex(/^[a-zA-Z0-9_\-\.\/]+$/, 'Branch name must only contain alphanumeric characters, underscores, dashes, dots, or slashes'),
});

export const terminalCommandSchema = z.object({
  command: z.string().min(1, 'Command is required').max(500),
});

export const recoverReflogSchema = z.object({
  reflogId: z.number().int().positive('Valid reflog entry ID required'),
});

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
