import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createTaskSchema, updateTaskSchema } from './tasks.validation';
import {
  getTasks,
  getTask,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
  getAllTasksAdminHandler,
  getStatsHandler,
} from './tasks.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', getStatsHandler);
router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTaskHandler);
router.get('/:id', getTask);
router.put('/:id', validate(updateTaskSchema), updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export const adminTaskRouter = Router();
adminTaskRouter.use(authenticate, authorize('ADMIN'));
adminTaskRouter.get('/tasks', getAllTasksAdminHandler);

export default router;
