import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { authService } from '../services/auth.service';

export class UserController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await User.find()
        .select('-password -twoFactorSecret')
        .populate('assignedUnits')
        .populate('assignedShifts')
        .sort({ lastName: 1, firstName: 1 });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id)
        .select('-password -twoFactorSecret')
        .populate('assignedUnits')
        .populate('assignedShifts');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { password, ...userData } = req.body;

      const hashedPassword = await authService.hashPassword(password);

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const userResponse = await User.findById(user._id)
        .select('-password -twoFactorSecret')
        .populate('assignedUnits')
        .populate('assignedShifts');

      res.status(201).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { password, ...updateData } = req.body;

      if (password) {
        updateData.password = await authService.hashPassword(password);
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .select('-password -twoFactorSecret')
        .populate('assignedUnits')
        .populate('assignedShifts');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
