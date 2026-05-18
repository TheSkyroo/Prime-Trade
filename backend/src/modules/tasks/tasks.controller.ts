import { Response, NextFunction } from 'express';
import { TaskStatus } from '@prisma/client';
import {
  getTasksForUser,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllTasksAdmin,
  getTaskStats,
} from './tasks.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../types';

function parsePagination(page: unknown, limit: unknown) {
  return {
    page: Math.max(1, parseInt(String(page || '1'), 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(String(limit || '10'), 10) || 10)),
  };
}

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks (own tasks for USER, all for ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 *       401:
 *         description: Unauthorized
 */
export async function getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await getTasksForUser(req.user!.userId, req.user!.role, page, limit);
    sendSuccess(res, result, 'Tasks fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task fetched successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
export async function getTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await getTaskById(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, task, 'Task fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Complete project setup
 *               description:
 *                 type: string
 *                 example: Set up the backend and frontend projects
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       201:
 *         description: Task created successfully
 *       422:
 *         description: Validation error
 */
export async function createTaskHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await createTask(req.user!.userId, req.body);
    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
export async function updateTaskHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await updateTask(req.params.id, req.user!.userId, req.user!.role, req.body);
    sendSuccess(res, task, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
export async function deleteTaskHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteTask(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, null, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/admin/tasks:
 *   get:
 *     tags: [Admin]
 *     summary: Get ALL tasks with user info (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: All tasks fetched successfully
 *       403:
 *         description: Admin access required
 */
export async function getAllTasksAdminHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const status = req.query.status as TaskStatus | undefined;
    const result = await getAllTasksAdmin(page, limit, status);
    sendSuccess(res, result, 'All tasks fetched successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task statistics for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats fetched successfully
 */
export async function getStatsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getTaskStats(req.user!.userId, req.user!.role);
    sendSuccess(res, stats, 'Stats fetched successfully');
  } catch (err) {
    next(err);
  }
}
