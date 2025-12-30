import mongoose, { Schema, Document } from 'mongoose';
import { Visit as IVisit } from '@dialyflow/shared';

export interface VisitDocument extends Omit<IVisit, '_id' | 'patient' | 'unit' | 'shift' | 'provider'>, Document {
  patient: mongoose.Types.ObjectId;
  unit: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
}

const visitSchema = new Schema<VisitDocument>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitType: {
      type: String,
      enum: ['in-person', 'telemedicine'],
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
    recordCompleted: {
      type: Boolean,
      default: false,
    },
    carePlanDone: {
      type: Boolean,
      default: false,
    },
    cipaDone: {
      type: Boolean,
      default: false,
    },
    billingCodes: [{
      type: String,
    }],
    referrals: [{
      type: String,
    }],
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

visitSchema.index({ patient: 1, visitDate: -1 });
visitSchema.index({ unit: 1, shift: 1, visitDate: -1 });
visitSchema.index({ provider: 1, visitDate: -1 });
visitSchema.index({ visitDate: -1 });

export const Visit = mongoose.model<VisitDocument>('Visit', visitSchema);
