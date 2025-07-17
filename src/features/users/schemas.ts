import { z } from "zod";

export const ChangeUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "MONITEUR", "CUSTOMER"]),
});

