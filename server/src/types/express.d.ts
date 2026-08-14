export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawToken?: string;
    }
  }
}
