import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id?: string;
      token?: {
        access_token: string;
      };
    }
  }
}

export interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
  token?: {
    access_token: string;
  };
} 