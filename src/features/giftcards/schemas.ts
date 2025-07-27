import { z } from "zod";

export const CreateGiftCardSchema = z.object({
  code: z.string().min(1, { message: "Le code est requis" }),
  amount: z.number().min(0.01, { message: "Le montant doit être supérieur à 0" }),
  customerId: z.string().optional(),
});

export const UpdateGiftCardSchema = z.object({
  amount: z.number().min(0.01, { message: "Le montant doit être supérieur à 0" }).optional(),
  isUsed: z.boolean().optional(),
  usedBy: z.string().optional(),
  usedAt: z.coerce.date().optional(),
});

export const UseGiftCardSchema = z.object({
  usedBy: z.string().min(1, { message: "L'utilisateur est requis" }),
});

export type CreateGiftCard = z.infer<typeof CreateGiftCardSchema>;
export type UpdateGiftCard = z.infer<typeof UpdateGiftCardSchema>;
export type UseGiftCard = z.infer<typeof UseGiftCardSchema>;