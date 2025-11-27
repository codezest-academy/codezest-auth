import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { PrismaSessionRepository } from '../../infrastructure/repositories/session.repository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Dependencies
const sessionRepository = new PrismaSessionRepository();
const sessionController = new SessionController(sessionRepository);

// Routes
router.use(authenticate); // All session routes require authentication

router.get('/', sessionController.getSessions);
router.delete('/other', sessionController.revokeOtherSessions);
router.delete('/:id', sessionController.revokeSession);

export default router;
