import mongoose, { Schema, Document } from 'mongoose';
import { Patient as IPatient } from '@dialyflow/shared';

export interface PatientDocument extends Omit<IPatient, '_id' | 'unit' | 'shift'>, Document {
  unit: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
}

const patientSchema = new Schema<PatientDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    medicalRecordNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ unit: 1, shift: 1 });
patientSchema.index({ lastName: 1, firstName: 1 });
patientSchema.index({ medicalRecordNumber: 1 });
patientSchema.index({ isActive: 1 });

export const Patient = mongoose.model<PatientDocument>('Patient', patientSchema);
