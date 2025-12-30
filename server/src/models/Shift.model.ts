import mongoose, { Schema, Document } from 'mongoose';
import { Shift as IShift } from '@dialyflow/shared';

export interface ShiftDocument extends Omit<IShift, '_id' | 'unit'>, Document {
  unit: mongoose.Types.ObjectId;
}

const shiftSchema = new Schema<ShiftDocument>(
  {
    code: {
      type: String,
      enum: ['MWF_FIRST', 'MWF_SECOND', 'TTH_SAT_FIRST', 'TTH_SAT_SECOND', 'PD'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    days: [{
      type: String,
    }],
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ unit: 1, code: 1 }, { unique: true });
shiftSchema.index({ code: 1 });
shiftSchema.index({ isActive: 1 });

export const Shift = mongoose.model<ShiftDocument>('Shift', shiftSchema);
