import ExcelJS from 'exceljs';
import { Visit } from '../models/Visit.model';
import { Patient } from '../models/Patient.model';
import { User } from '../models/User.model';
import { Unit } from '../models/Unit.model';
import { Shift } from '../models/Shift.model';
import { ExportRequest, ExportData } from '@dialyflow/shared';

export class ExportService {
  async exportToExcel(params: ExportRequest): Promise<ExcelJS.Buffer> {
    const data = await this.getExportData(params);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Visit Data');

    // Add headers
    worksheet.columns = [
      { header: 'Patient Name', key: 'patientName', width: 25 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
      { header: 'Visit Date', key: 'visitDate', width: 15 },
      { header: 'Visit Type', key: 'visitType', width: 15 },
      { header: 'Unit', key: 'unit', width: 20 },
      { header: 'Shift', key: 'shift', width: 30 },
      { header: 'Record Completed', key: 'recordCompleted', width: 18 },
      { header: 'Care Plan Done', key: 'carePlanDone', width: 18 },
      { header: 'CIPA Done', key: 'cipaDone', width: 12 },
      { header: 'Billing Codes', key: 'billingCodes', width: 30 },
      { header: 'Referrals', key: 'referrals', width: 30 },
      { header: 'Provider', key: 'provider', width: 25 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    data.forEach(row => {
      worksheet.addRow(row);
    });

    return workbook.xlsx.writeBuffer();
  }

  async exportToCsv(params: ExportRequest): Promise<string> {
    const data = await this.getExportData(params);

    const headers = [
      'Patient Name',
      'Date of Birth',
      'Visit Date',
      'Visit Type',
      'Unit',
      'Shift',
      'Record Completed',
      'Care Plan Done',
      'CIPA Done',
      'Billing Codes',
      'Referrals',
      'Provider',
    ];

    const rows = data.map(row => [
      row.patientName,
      row.dateOfBirth,
      row.visitDate,
      row.visitType,
      row.unit,
      row.shift,
      row.recordCompleted,
      row.carePlanDone,
      row.cipaDone,
      row.billingCodes,
      row.referrals,
      row.provider,
    ]);

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private async getExportData(params: ExportRequest): Promise<ExportData[]> {
    const query: any = {
      visitDate: {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      },
    };

    if (params.units && params.units.length > 0) {
      query.unit = { $in: params.units };
    }

    if (params.shifts && params.shifts.length > 0) {
      query.shift = { $in: params.shifts };
    }

    if (params.visitType) {
      query.visitType = params.visitType;
    }

    const visits = await Visit.find(query)
      .populate('patient')
      .populate('unit')
      .populate('shift')
      .populate('provider')
      .sort({ visitDate: -1 })
      .lean();

    return visits.map(visit => {
      const patient = visit.patient as any;
      const unit = visit.unit as any;
      const shift = visit.shift as any;
      const provider = visit.provider as any;

      return {
        patientName: `${patient.lastName}, ${patient.firstName}`,
        dateOfBirth: new Date(patient.dateOfBirth).toLocaleDateString(),
        visitDate: new Date(visit.visitDate).toLocaleDateString(),
        visitType: visit.visitType === 'in-person' ? 'In-Person' : 'Telemedicine',
        unit: unit.name,
        shift: shift.name,
        recordCompleted: visit.recordCompleted ? 'Yes' : 'No',
        carePlanDone: visit.carePlanDone ? 'Yes' : 'No',
        cipaDone: visit.cipaDone ? 'Yes' : 'No',
        billingCodes: visit.billingCodes.join(', '),
        referrals: visit.referrals.join(', '),
        provider: `${provider.lastName}, ${provider.firstName}`,
      };
    });
  }
}

export const exportService = new ExportService();
