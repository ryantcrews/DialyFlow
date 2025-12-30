import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Unit } from '../models/Unit.model';

export class UnitController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const units = await Unit.find({ isActive: true }).sort({ name: 1 });

      res.json({
        success: true,
        data: units,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const unit = await Unit.findById(req.params.id);

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found',
        });
      }

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const unit = await Unit.create(req.body);

      res.status(201).json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const unit = await Unit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found',
        });
      }

      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const unitController = new UnitController();
