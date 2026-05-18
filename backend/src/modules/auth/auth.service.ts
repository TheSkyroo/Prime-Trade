import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.validation';

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const err = new Error('Email already registered') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const tokens = await createTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const tokens = await createTokenPair(user.id, user.role);
  return {
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    ...tokens,
  };
}

export async function refreshUserToken(token: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // Find stored token — compare using bcrypt since we store hash
  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId: payload.userId, expiresAt: { gt: new Date() } },
  });

  let matchedToken = null;
  for (const stored of storedTokens) {
    const match = await bcrypt.compare(token, stored.token);
    if (match) { matchedToken = stored; break; }
  }

  if (!matchedToken) {
    const err = new Error('Refresh token not found or expired') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    const err = new Error('User not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: matchedToken.id } });
  const tokens = await createTokenPair(user.id, user.role);
  return { user, ...tokens };
}

export async function logoutUser(token: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return;
  }

  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId: payload.userId },
  });

  for (const stored of storedTokens) {
    const match = await bcrypt.compare(token, stored.token);
    if (match) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      break;
    }
  }
}

export async function logoutAllSessions(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

async function createTokenPair(userId: string, role: string) {
  const accessToken = generateAccessToken({ userId, role: role as 'USER' | 'ADMIN' });
  const refreshToken = generateRefreshToken({ userId });

  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: tokenHash, userId, expiresAt },
  });

  // Clean up expired tokens for this user
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  return { accessToken, refreshToken };
}
