import type { Request } from 'express';

/** Payload yang di-attach ke `req.user` setelah token JWT tervalidasi. */
export interface AuthUserPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUserPayload;
}
