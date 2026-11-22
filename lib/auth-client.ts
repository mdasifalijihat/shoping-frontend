import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  fetchOptions: { credentials: "include" },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: ["SUPER_ADMIN", "ADMIN", "CUSTOMER"],
          input: false,
        },
        phone: { type: "string", required: false, input: false },
        address: { type: "string", required: false, input: false },
        isBlocked: { type: "boolean", input: false },
      },
    }),
  ],
});

export type AuthUser = typeof authClient.$Infer.Session.user;
