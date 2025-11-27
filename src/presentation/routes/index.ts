import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import oauthRoutes from './oauth.routes';
import sessionRoutes from './session.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/auth/oauth', oauthRoutes);
router.use('/sessions', sessionRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CodeZest Auth Service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
