import { getAuth } from "firebase-admin/auth";
import { prisma } from "../prisma";
import APIError from "../errors/APIError";
import { asyncHandler } from "../middleware/asyncHandler";
import { firebaseEnabled } from "../firebase/firebase";

/**
 * Verifies a Firebase ID token and ensures a matching `User` row exists (for appendUserId / analytics).
 */
export const syncUser = asyncHandler(async (req, res) => {
  if (!firebaseEnabled) {
    throw new APIError(
      503,
      "Firebase auth is not configured on this server",
      "AUTH_DISABLED"
    );
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new APIError(401, "Missing bearer token", "INVALID_TOKEN");
  }

  const decoded = await getAuth().verifyIdToken(token);
  const uid = decoded.uid;
  const email =
    decoded.email ?? `${uid}@users.noreply.firebase.local`;
  const name =
    (typeof decoded.name === "string" && decoded.name) ||
    email.split("@")[0] ||
    "User";

  const user = await prisma.user.upsert({
    where: { firebaseId: uid },
    create: {
      firebaseId: uid,
      email,
      name,
    },
    update: {
      email,
      name,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
  });
});
