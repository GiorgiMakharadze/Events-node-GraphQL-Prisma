import { Response, NextFunction } from 'express';
import { V4 as paseto } from 'paseto';
import 'dotenv/config';
import { publicKeyPEM } from '_rest/utils/keyManager';
import { prisma } from '_app/prisma/client';
import { UnauthenticatedError, UnauthorizedError } from '_rest/errors';

const authenticateToken = async (req, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const payload = await paseto.verify(token, publicKeyPEM);

  if (!payload || typeof payload.id !== 'string') {
    throw new UnauthenticatedError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });
  if (!user) {
    throw new UnauthorizedError('Invalid token: user not found');
  }

  req.user = user;
  next();
};

export default authenticateToken;
