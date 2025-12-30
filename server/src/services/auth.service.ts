import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../models/User.model';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      requiresTwoFactor: user.twoFactorEnabled,
    };
  }

  async setupTwoFactor(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${config.twoFactorIssuer} (${user.email})`,
      issuer: config.twoFactorIssuer,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId);

    if (!user || !user.twoFactorSecret) {
      throw new Error('Two-factor authentication not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return verified;
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const verified = await this.verifyTwoFactor(userId, token);

    if (!verified) {
      throw new Error('Invalid two-factor token');
    }

    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });

    return true;
  }

  async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return true;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }
}

export const authService = new AuthService();
