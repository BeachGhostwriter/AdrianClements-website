import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const adminRouter = Router();
adminRouter.use(authenticate);

// Routes implemented in Phase 2
adminRouter.get('/', (_req, res) => res.json({ message: 'admin endpoint — Phase 2' }));
