import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '@dialyflow/shared';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
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
    role: {
      type: String,
      enum: ['admin', 'doctor', 'billing'],
      required: true,
      default: 'doctor',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    assignedUnits: [{
      type: Schema.Types.ObjectId,
      ref: 'Unit',
    }],
    assignedShifts: [{
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    }],
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export const User = mongoose.model<UserDocument>('User', userSchema);
