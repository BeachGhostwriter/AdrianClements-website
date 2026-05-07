import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const organisationsRouter = Router();
organisationsRouter.use(authenticate);

// Routes implemented in Phase 2
organisationsRouter.get('/', (_req, res) => res.json({ message: 'organisations endpoint — Phase 2' }));
