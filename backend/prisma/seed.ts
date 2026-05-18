import { PrismaClient, TaskStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const userHash = await bcrypt.hash('User@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const tasks: Array<{ title: string; description: string; status: TaskStatus }> = [
    {
      title: 'Set up project infrastructure',
      description: 'Initialize backend and frontend projects with required dependencies',
      status: 'COMPLETED',
    },
    {
      title: 'Implement authentication module',
      description: 'Build JWT-based auth with register, login, refresh, and logout endpoints',
      status: 'COMPLETED',
    },
    {
      title: 'Build task management API',
      description: 'Create CRUD endpoints for task management with RBAC',
      status: 'IN_PROGRESS',
    },
    {
      title: 'Design frontend UI components',
      description: 'Create reusable UI components with Tailwind CSS',
      status: 'IN_PROGRESS',
    },
    {
      title: 'Write comprehensive API documentation',
      description: 'Document all endpoints using Swagger/OpenAPI specification',
      status: 'PENDING',
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, userId: user.id } });
  }

  console.log(`Seeded: admin (${admin.email}), user (${user.email}), ${tasks.length} tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
