import { z } from "zod";

export const CreatePromoCodeSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Le code est requis" })
    .max(50)
    .toUpperCase(),
  label: z.string().optional(),
  recipientNote: z.string().optional(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]),
  discountValue: z
    .number()
    .min(0.01, { message: "La valeur de réduction doit être > 0" }),
  maxDiscountAmount: z.number().optional(), // Plafond pour les codes PERCENTAGE
  minCartAmount: z.number().optional(),
  maxUses: z.number().int().min(1).optional(),
  expiryDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePromoCodeSchema = z.object({
  label: z.string().optional(),
  recipientNote: z.string().optional(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: z.number().min(0.01).optional(),
  maxDiscountAmount: z.number().optional(),
  minCartAmount: z.number().optional(),
  maxUses: z.number().int().min(1).optional(),
  expiryDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Schema pour valider un code depuis le front (checkout)
export const ValidatePromoCodeSchema = z.object({
  code: z.string().min(1, { message: "Le code est requis" }),
  cartTotal: z.number().min(0, { message: "Le montant du panier est requis" }),
});

export type CreatePromoCode = z.infer<typeof CreatePromoCodeSchema>;
export type UpdatePromoCode = z.infer<typeof UpdatePromoCodeSchema>;
export type ValidatePromoCode = z.infer<typeof ValidatePromoCodeSchema>;
