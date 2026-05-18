import { Router } from 'express';
import authRouter from '../../modules/auth/auth.routes';
import taskRouter, { adminTaskRouter } from '../../modules/tasks/tasks.routes';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/tasks', taskRouter);
v1Router.use('/admin', adminTaskRouter);

export default v1Router;
