import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class AuthService {
  constructor(
      @InjectModel(User.name) private userModel: Model<User>,
      private jwtService: JwtService,
  ) {}

  async googleLogin(accessToken: string, refreshToken: string, profile: any): Promise<{ user: User; token: string }> {
    try {
      let user = await this.userModel.findOne({ googleId: profile.id }).exec();

      if (!user) {
        user = await this.userModel.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          googleAccounts: [{ email: profile.emails[0].value, accessToken }],
        });
      } else {
        const updatedUser = await this.userModel.findOneAndUpdate(
            { googleId: profile.id },
            { $addToSet: { googleAccounts: { email: profile.emails[0].value, accessToken } } },
            { new: true },
        );
        if (!updatedUser) {
          throw new Error('Failed to update user');
        }
        user = updatedUser;
      }

      const token = this.jwtService.sign({
        sub: user.id, // Use id getter instead of _id.toString()
        email: user.email,
        name: user.name,
        googleAccounts: user.googleAccounts,
        accessToken,
      });

      return { user, token };
    } catch (error) {
      console.error('googleLogin error:', {
        message: error.message,
        stack: error.stack,
        profile: profile ? JSON.stringify(profile, null, 2) : 'No profile',
      });
      throw error;
    }
  }

  async validateOAuthLogin(email: string, name: string, accessToken: string, googleId: string): Promise<{ user: User; token: string }> {
    try {
      let user = await this.userModel.findOne({ email });
      if (!user) {
        console.log('Creating new user:', { email, name, googleId });
        user = await this.userModel.create({
          email,
          name,
          googleId,
          googleAccounts: [{ email, accessToken }],
        });
        console.log('User created:', user);
      } else {
        const updatedUser = await this.userModel.findOneAndUpdate(
            { email },
            {
              $addToSet: { googleAccounts: { email, accessToken } },
              googleId,
            },
            { new: true },
        );
        if (!updatedUser) {
          throw new Error('Failed to update user');
        }
        user = updatedUser;
        console.log('User updated:', user);
      }

      const token = this.jwtService.sign({
        sub: user.id, // Use id getter instead of _id.toString()
        email: user.email,
        name: user.name,
        googleAccounts: user.googleAccounts,
        accessToken,
      });
      console.log('JWT token generated:', token);
      return { user, token };
    } catch (error) {
      console.error('validateOAuthLogin error:', {
        message: error.message,
        stack: error.stack,
        email,
        name,
        googleId,
      });
      throw error;
    }
  }

  async addGoogleAccount(userId: string, email: string, accessToken: string): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndUpdate(
          userId,
          { $addToSet: { googleAccounts: { email, accessToken } } },
          { new: true },
      );
      if (!user) {
        throw new Error('User not found');
      }
      console.log('Added Google account to user:', { userId, email });
      return user;
    } catch (error) {
      console.error('addGoogleAccount error:', {
        message: error.message,
        stack: error.stack,
        userId,
        email,
      });
      throw error;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await this.userModel.findById(id);
    } catch (error) {
      console.error('findUserById error:', {
        message: error.message,
        stack: error.stack,
        id,
      });
      throw error;
    }
  }
}