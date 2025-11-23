import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';
import { OAuthService } from '../../application/services/oauth.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { OAuthRepository } from '../../infrastructure/repositories/oauth.repository';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Dependency Injection
const userRepository = new UserRepository();
const oauthRepository = new OAuthRepository();
const sessionRepository = new SessionRepository();

const oauthService = new OAuthService(userRepository, oauthRepository, sessionRepository);
const oauthController = new OAuthController(oauthService);

// Google OAuth
/**
 * @swagger
 * /auth/oauth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.get('/google', oauthController.getGoogleAuthUrl);

/**
 * @swagger
 * /auth/oauth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 */
router.get('/google/callback', oauthController.handleGoogleCallback);

// GitHub OAuth
/**
 * @swagger
 * /auth/oauth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [OAuth]
 *     responses:
 *       302:
 *         description: Redirects to GitHub login
 */
router.get('/github', oauthController.getGitHubAuthUrl);

/**
 * @swagger
 * /auth/oauth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from GitHub
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 */
router.get('/github/callback', oauthController.handleGitHubCallback);

// Protected routes
/**
 * @swagger
 * /auth/oauth/linked:
 *   get:
 *     summary: Get linked OAuth providers
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Linked providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                           providerId:
 *                             type: string
 *                           linkedAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/linked', authenticate, oauthController.getLinkedProviders);

/**
 * @swagger
 * /auth/oauth/{provider}:
 *   delete:
 *     summary: Unlink an OAuth provider
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         required: true
 *         description: Provider to unlink
 *     responses:
 *       200:
 *         description: Provider unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Provider unlinked successfully
 */
router.delete('/:provider', authenticate, oauthController.unlinkProvider);

export default router;
