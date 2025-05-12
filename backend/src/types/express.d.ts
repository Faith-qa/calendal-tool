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

import { Request } from 'express';
import { User } from '../user.schema';

export interface RequestWithUser extends Request {
  user?: User;
}