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

  async validateOAuthLogin(email: string, name: string, accessToken: string): Promise<{ user: User; token: string }> {
    let user = await this.userModel.findOne({ email });
    if (!user) {
      user = await this.userModel.create({ email, name, accessToken });
    } else {
      const updatedUser = await this.userModel.findByIdAndUpdate(user._id, { accessToken }, { new: true });
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }
      user = updatedUser;
    }
    const token = this.jwtService.sign({ sub: user._id, email: user.email, name: user.name });
    return { user, token };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }
} 