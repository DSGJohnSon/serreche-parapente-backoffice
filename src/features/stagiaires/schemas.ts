import { z } from "zod";

export const AddStagiaireSchema = z.object({
  firstName: z.string().min(1, { message: "Le prénom est requis" }),
  lastName: z.string().min(1, { message: "Le nom est requis" }),
  email: z
    .string()
    .email({ message: "L'email doit être valide" })
    .min(1, { message: "L'email est requis" }),
  phone: z.string().min(5, { message: "Le numéro de téléphone est requis" }),
  birthDate: z.date().optional(),
  height: z.coerce.number().min(1, { message: "La taille doit être supérieure ou égale à 1" }),
  weight: z.coerce.number().min(1, { message: "Le poids doit être supérieur ou égal à 1" }),
});

export const UpdateStagiaireSchema = AddStagiaireSchema.partial();