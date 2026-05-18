import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

router.use(authRateLimiter);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
