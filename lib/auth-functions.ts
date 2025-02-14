/**
 * This is wrapper around clerk - the idea being that we can swap out the auth provider without changing logic in any of thepages or routes.
 */

import { currentUser } from "@clerk/nextjs/server";
import { getAuth } from "@hono/clerk-auth";
import { Context } from "hono";

export const getSessionUserId = async (context: Context) => {
  const auth = await getAuth(context);
  return auth?.userId ? auth.userId : undefined;
};

export const getUser = async () => (await currentUser())?.id || null;
