import { TaskStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateTaskInput, UpdateTaskInput } from './tasks.validation';

export async function getTasksForUser(
  userId: string,
  role: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const where = role === 'ADMIN' ? {} : { userId };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: role === 'ADMIN' ? { user: { select: { id: true, email: true, role: true } } } : undefined,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTaskById(id: string, userId: string, role: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!task) {
    const err = new Error('Task not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (role !== 'ADMIN' && task.userId !== userId) {
    const err = new Error('Forbidden') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  return task;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: { ...input, userId },
  });
}

export async function updateTask(
  id: string,
  userId: string,
  role: string,
  input: UpdateTaskInput
) {
  await getTaskById(id, userId, role);
  return prisma.task.update({ where: { id }, data: input });
}

export async function deleteTask(id: string, userId: string, role: string) {
  await getTaskById(id, userId, role);
  await prisma.task.delete({ where: { id } });
}

export async function getAllTasksAdmin(page: number, limit: number, status?: TaskStatus) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, role: true } } },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTaskStats(userId: string, role: string) {
  const where = role === 'ADMIN' ? {} : { userId };
  const [total, completed, inProgress, pending] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { ...where, status: 'PENDING' } }),
  ]);
  return { total, completed, inProgress, pending };
}
