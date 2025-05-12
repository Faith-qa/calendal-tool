import { Request } from 'express';
import { User } from '../auth/user.schema';

export interface RequestWithUser extends Request {
  user?: User & { accessToken: string; googleEmail?: string };
}