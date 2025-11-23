import { TokenPayload } from '../utils/token.util';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
