import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Patient } from '../models/Patient.model';

export class PatientController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { unit, shift, search, isActive = 'true' } = req.query;

      const query: any = {};

      if (unit) query.unit = unit;
      if (shift) query.shift = shift;
      if (isActive) query.isActive = isActive === 'true';

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { medicalRecordNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const patients = await Patient.find(query)
        .populate('unit')
        .populate('shift')
        .sort({ lastName: 1, firstName: 1 });

      res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await Patient.findById(req.params.id)
        .populate('unit')
        .populate('shift');

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await Patient.create(req.body);

      const populated = await Patient.findById(patient._id)
        .populate('unit')
        .populate('shift');

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
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('unit')
        .populate('shift');

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }

      res.json({
        success: true,
        message: 'Patient deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
