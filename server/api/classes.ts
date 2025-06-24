import { ClassesService } from '../classes-service.js';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const filters = req.query || {};
  const result = await ClassesService.getClasses(filters);

  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error });
  }

  return res.status(200).json({ success: true, data: result.data });
} 