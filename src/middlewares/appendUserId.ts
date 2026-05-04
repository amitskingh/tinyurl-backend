import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { prisma } from "../prisma";
import { firebaseEnabled } from "../firebase/firebase";

export const appendUserdId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!firebaseEnabled) {
    next();
    return;
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decodedToken = await getAuth().verifyIdToken(token);
      if (decodedToken) {
        const user = await prisma.user.findFirst({
          where: {
            firebaseId: decodedToken.uid,
          },
        });

        if (user) {
          req.user.userId = user.id;
        }
      }
    }
  } catch (error) {
    console.warn("appendUserId: token verification skipped:", error);
  } finally {
    next();
  }
};
