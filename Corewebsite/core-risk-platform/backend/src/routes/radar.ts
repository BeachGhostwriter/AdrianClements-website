import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const radarRouter = Router();
radarRouter.use(authenticate);

// Routes implemented in Phase 2
radarRouter.get('/', (_req, res) => res.json({ message: 'radar endpoint — Phase 2' }));
