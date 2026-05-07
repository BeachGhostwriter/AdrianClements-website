import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const forgeRouter = Router();
forgeRouter.use(authenticate);

// Routes implemented in Phase 2
forgeRouter.get('/', (_req, res) => res.json({ message: 'forge endpoint — Phase 2' }));
