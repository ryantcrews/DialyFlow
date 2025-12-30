import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { twoFactorService } from '../services/twoFactor.service';
import { User } from '../models/User.model';
import { logger } from '../utils/logger';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      const hashedPassword = await authService.hashPassword(password);

      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'doctor',
      });

      const token = authService.generateToken(user._id.toString());

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      if (result.requiresTwoFactor) {
        return res.json({
          success: true,
          data: {
            requiresTwoFactor: true,
            userId: result.user._id,
          },
        });
      }

      const token = authService.generateToken(result.user._id);
      await authService.updateLastLogin(result.user._id);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
  }

  async verifyTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, token } = req.body;

      const verified = await authService.verifyTwoFactor(userId, token);

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification code',
        });
      }

      const authToken = authService.generateToken(userId);
      await authService.updateLastLogin(userId);

      res.cookie('token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const user = await User.findById(userId).select('-password -twoFactorSecret');

      res.json({
        success: true,
        data: {
          user,
          token: authToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async setupTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!._id;

      const result = await twoFactorService.generateSecret(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async enableTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!._id;
      const { token } = req.body;

      await twoFactorService.enable(userId, token);

      res.json({
        success: true,
        message: 'Two-factor authentication enabled',
      });
    } catch (error) {
      next(error);
    }
  }

  async disableTwoFactor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!._id;

      await twoFactorService.disable(userId);

      res.json({
        success: true,
        message: 'Two-factor authentication disabled',
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!._id)
        .select('-password -twoFactorSecret')
        .populate('assignedUnits')
        .populate('assignedShifts');

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token');

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
