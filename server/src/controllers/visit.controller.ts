import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Visit } from '../models/Visit.model';
import { Patient } from '../models/Patient.model';

export class VisitController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patient, unit, shift, visitType, startDate, endDate } = req.query;

      const query: any = {};

      if (patient) query.patient = patient;
      if (unit) query.unit = unit;
      if (shift) query.shift = shift;
      if (visitType) query.visitType = visitType;

      if (startDate || endDate) {
        query.visitDate = {};
        if (startDate) query.visitDate.$gte = new Date(startDate as string);
        if (endDate) query.visitDate.$lte = new Date(endDate as string);
      }

      const visits = await Visit.find(query)
        .populate('patient')
        .populate('unit')
        .populate('shift')
        .populate('provider')
        .sort({ visitDate: -1 });

      res.json({
        success: true,
        data: visits,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await Visit.findById(req.params.id)
        .populate('patient')
        .populate('unit')
        .populate('shift')
        .populate('provider');

      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
      }

      res.json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visitData = {
        ...req.body,
        provider: req.user!._id,
      };

      const visit = await Visit.create(visitData);

      const populated = await Visit.findById(visit._id)
        .populate('patient')
        .populate('unit')
        .populate('shift')
        .populate('provider');

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
      const visit = await Visit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('patient')
        .populate('unit')
        .populate('shift')
        .populate('provider');

      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
      }

      res.json({
        success: true,
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await Visit.findByIdAndDelete(req.params.id);

      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
      }

      res.json({
        success: true,
        message: 'Visit deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;

      const visits = await Visit.find({ patient: patientId })
        .populate('unit')
        .populate('shift')
        .populate('provider')
        .sort({ visitDate: -1 });

      res.json({
        success: true,
        data: visits,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const visitController = new VisitController();
