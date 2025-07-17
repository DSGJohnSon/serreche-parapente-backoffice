import { z } from "zod";

export const AddCustomerSchema = z.object({
  firstname: z.string().min(1, { message: "Le prénom est requis" }),
  lastname: z.string().min(1, { message: "Le nom est requis" }),
  email: z
    .string()
    .email({ message: "L'email doit être valide" })
    .min(1, { message: "L'email est requis" }),
  phone: z.string().min(5, { message: "Le numéro de téléphone est requis" }),
  adress: z.string().min(1, { message: "L'adresse est requise" }),
  postalCode: z.string().min(1, { message: "Le code postal est requis" }),
  city: z.string().min(1, { message: "La ville est requise" }),
  country: z.string().min(1, { message: "Le pays est requis" }),
  height: z.string().min(1, { message: "La taille doit être supérieure ou égale à 0" }),
  weight: z.string().min(1, { message: "Le poids doit être supérieur ou égal à 0" }),
});
