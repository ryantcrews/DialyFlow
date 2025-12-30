import mongoose, { Schema, Document } from 'mongoose';
import { Comment as IComment } from '@dialyflow/shared';

export interface CommentDocument extends Omit<IComment, '_id' | 'visit' | 'patient' | 'author'>, Document {
  visit: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
}

const commentSchema = new Schema<CommentDocument>(
  {
    visit: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ visit: 1, createdAt: -1 });
commentSchema.index({ patient: 1, createdAt: -1 });

export const Comment = mongoose.model<CommentDocument>('Comment', commentSchema);
