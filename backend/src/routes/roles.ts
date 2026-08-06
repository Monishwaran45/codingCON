import { Router, Request, Response } from 'express';
import { Role } from '../db/models/Role';

const router = Router();

// GET /api/roles
router.get('/', async (_req: Request, res: Response) => {
  try {
    const roles = await Role.find({}, { name: 1, permissions: 1, _id: 0 });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

export default router;
