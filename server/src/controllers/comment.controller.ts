import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Comment } from '../models/Comment.model';

export class CommentController {
  async getByVisit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { visitId } = req.params;

      const comments = await Comment.find({ visit: visitId })
        .populate('author', 'firstName lastName')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const commentData = {
        ...req.body,
        author: req.user!._id,
      };

      const comment = await Comment.create(commentData);

      const populated = await Comment.findById(comment._id)
        .populate('author', 'firstName lastName');

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
      const comment = await Comment.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      // Only allow author to update
      if (comment.author.toString() !== req.user!._id && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment',
        });
      }

      comment.text = req.body.text;
      await comment.save();

      const populated = await Comment.findById(comment._id)
        .populate('author', 'firstName lastName');

      res.json({
        success: true,
        data: populated,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await Comment.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      // Only allow author or admin to delete
      if (comment.author.toString() !== req.user!._id && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment',
        });
      }

      await comment.deleteOne();

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
