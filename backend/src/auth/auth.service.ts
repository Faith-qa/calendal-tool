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
    let user = await this.userModel.findOne({ googleId: profile.id }).exec();

    if (!user) {
      user = await this.userModel.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        googleTokens: [accessToken],
      });
    } else if (!user.googleTokens.includes(accessToken)) {
      user.googleTokens.push(accessToken);
      await user.save();
    }

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      name: user.name,
      googleTokens: user.googleTokens,
      accessToken,
    });

    return { user, token };
  }

  async validateOAuthLogin(email: string, name: string, accessToken: string, googleId: string): Promise<{ user: User; token: string }> {
    let user = await this.userModel.findOne({ email });
    if (!user) {
      user = await this.userModel.create({
        email,
        name,
        googleId,
        googleTokens: [accessToken],
      });
    } else {
      const updatedUser = await this.userModel.findOneAndUpdate(
          { email },
          { $addToSet: { googleTokens: accessToken }, googleId },
          { new: true },
      );
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }
      user = updatedUser;
    }
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      name: user.name,
      googleTokens: user.googleTokens,
      accessToken,
    });
    return { user, token };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }
}