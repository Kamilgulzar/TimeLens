import { timelensApi } from "../api/timelens-api.js";
import type { AuthInfo } from "../types/activity.js";

/**
 * Authentication for the extension.
 *
 * The user signs in with their TimeLens credentials inside the popup. The
 * server verifies them and returns a short-lived bearer JWT. The extension
 * only stores that token (never passwords, never secrets) and sends it as
 * `Authorization: Bearer <token>` to the TimeLens API. The backend derives the
 * user from the token - a raw userId is never trusted.
 *
 * This module never touches persisted state itself; the tracker owns store
 * writes so all mutations stay serialized.
 */

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<AuthInfo> {
  const response = await timelensApi.extensionLogin(email, password);

  return {
    token: response.token,
    userId: response.user.id,
    email: response.user.email,
    displayName: [response.user.firstName, response.user.lastName]
      .filter(Boolean)
      .join(" "),
  };
}