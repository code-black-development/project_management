/**
 * This is wrapper around clerk - the idea being that we can swap out the auth provider without changing logic in any of thepages or routes.
 */

import { auth } from "@clerk/nextjs/server";

export const getUserId = async () => {
  return (await auth()).userId;
};
