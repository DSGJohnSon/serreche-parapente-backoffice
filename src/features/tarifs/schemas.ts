import { z } from "zod";
import { BaptemeCategory } from "@prisma/client";

export const UpdateTarifSchema = z.object({
  category: z.nativeEnum(BaptemeCategory),
  price: z.number().positive("Le prix doit être positif"),
});

export type UpdateTarifInput = z.infer<typeof UpdateTarifSchema>;