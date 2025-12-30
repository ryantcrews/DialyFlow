import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../models/User.model';
import { config } from '../config/app.config';

export class TwoFactorService {
  async generateSecret(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${config.twoFactorIssuer} (${user.email})`,
      issuer: config.twoFactorIssuer,
      length: 32,
    });

    // Save the secret to the user
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verify(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId);

    if (!user || !user.twoFactorSecret) {
      throw new Error('Two-factor authentication not configured');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    return verified;
  }

  async enable(userId: string, token: string): Promise<boolean> {
    const verified = await this.verify(userId, token);

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });

    return true;
  }

  async disable(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
    });
  }
}

export const twoFactorService = new TwoFactorService();
