import mongoose, { Schema, Document } from 'mongoose';
import { Unit as IUnit } from '@dialyflow/shared';

export interface UnitDocument extends Omit<IUnit, '_id'>, Document {}

const unitSchema = new Schema<UnitDocument>(
  {
    name: {
      type: String,
      enum: ['West Iredell', 'Taylorsville', 'Lake Norman', 'Statesville', 'Wilkesboro'],
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    address: {
      type: String,
    },
    phone: {
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

unitSchema.index({ name: 1 });
unitSchema.index({ code: 1 });
unitSchema.index({ isActive: 1 });

export const Unit = mongoose.model<UnitDocument>('Unit', unitSchema);
