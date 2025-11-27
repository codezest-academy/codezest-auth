import { Request, Response } from 'express';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { asyncHandler } from '../middleware/error.middleware';
import cache from '../../infrastructure/cache/cache.service';
import { NotFoundError } from '../../domain/errors';

export class SessionController {
  private sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  /**
   * Get all active sessions for the current user
   * GET /api/v1/sessions
   */
  getSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const currentSessionId = req.user!.sessionId;

    // Fetch sessions from DB
    const sessions = await this.sessionRepository.findByUserId(userId);

    // Enrich with metadata from Redis
    const sessionsWithMetadata = await Promise.all(
      sessions.map(async (session) => {
        const metadataJson = await cache.get<string>(`session_meta:${session.id}`);
        const metadata = metadataJson ? JSON.parse(metadataJson) : {};

        return {
          id: session.id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isCurrent: session.id === currentSessionId,
          ip: metadata.ip || null,
          userAgent: metadata.userAgent || null,
          lastUsedAt: metadata.lastUsedAt ? new Date(metadata.lastUsedAt) : null,
          lastLoginAt: metadata.lastLoginAt ? new Date(metadata.lastLoginAt) : null,
          loginMethod: metadata.loginMethod || 'password',
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: { sessions: sessionsWithMetadata },
    });
  });

  /**
   * Revoke a specific session
   * DELETE /api/v1/sessions/:id
   */
  revokeSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    // Verify session belongs to user
    const sessions = await this.sessionRepository.findByUserId(userId);
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Delete from DB
    await this.sessionRepository.delete(sessionId);

    // Delete metadata from Redis
    await cache.del(`session_meta:${sessionId}`);

    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully',
    });
  });

  /**
   * Revoke all other sessions except the current one
   * DELETE /api/v1/sessions/other
   */
  revokeOtherSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const currentSessionId = req.user!.sessionId;

    if (!currentSessionId) {
      // Should not happen if auth middleware is working and token has sessionId
      throw new NotFoundError('Current session ID not found');
    }

    const sessions = await this.sessionRepository.findByUserId(userId);

    const promises = sessions
      .filter((s) => s.id !== currentSessionId)
      .map(async (s) => {
        // Delete from DB
        await this.sessionRepository.delete(s.id);
        // Delete metadata from Redis
        await cache.del(`session_meta:${s.id}`);
      });

    await Promise.all(promises);

    res.status(200).json({
      status: 'success',
      message: 'All other sessions revoked successfully',
    });
  });
}
