import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { exportService } from '../services/export.service';

export class ExportController {
  async exportData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { format = 'excel', ...params } = req.body;

      if (format === 'excel') {
        const buffer = await exportService.exportToExcel(params);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=dialyflow-export-${Date.now()}.xlsx`
        );

        res.send(buffer);
      } else if (format === 'csv') {
        const csv = await exportService.exportToCsv(params);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=dialyflow-export-${Date.now()}.csv`
        );

        res.send(csv);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid export format',
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const exportController = new ExportController();
