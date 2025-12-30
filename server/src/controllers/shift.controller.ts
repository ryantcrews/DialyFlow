import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Shift } from '../models/Shift.model';

export class ShiftController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { unit } = req.query;

      const query: any = { isActive: true };
      if (unit) query.unit = unit;

      const shifts = await Shift.find(query)
        .populate('unit')
        .sort({ code: 1 });

      res.json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shift = await Shift.findById(req.params.id).populate('unit');

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found',
        });
      }

      res.json({
        success: true,
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shift = await Shift.create(req.body);

      const populated = await Shift.findById(shift._id).populate('unit');

      res.status(201).json({
        success: true,
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shift = await Shift.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('unit');

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: 'Shift not found',
        });
      }

      res.json({
        success: true,
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shiftController = new ShiftController();
