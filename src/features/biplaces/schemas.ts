import { z } from "zod";
import { StageType, BaptemeCategory } from "@prisma/client";
import { id } from "date-fns/locale";

// Export de l'enum pour utilisation dans les composants
export { BaptemeCategory };

export const CreateBaptemeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date doit être une date valide.",
  }),
  duration: z.number().int().min(1, {
    message: "La durée doit être supérieure à 0.",
  }),
  places: z.number().int().min(1, {
    message: "Le nombre de places doit être supérieur à 0.",
  }),
  moniteurIds: z.array(z.string().min(1)).min(1, {
    message: "Au moins un moniteur doit être sélectionné.",
  }),
  categories: z.array(z.nativeEnum(BaptemeCategory)).min(1, {
    message: "Au moins une catégorie doit être sélectionnée.",
  }),
  acomptePrice: z.number().min(0, {
    message: "Le montant de l'acompte doit être positif.",
  }),
});

export const UpdateBaptemeSchema = z.object({
  originalDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date originale doit être une date valide.",
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date doit être une date valide.",
  }),
  duration: z.number().int().min(1, {
    message: "La durée doit être supérieure à 0.",
  }),
  places: z.number().int().min(1, {
    message: "Le nombre de places doit être supérieur à 0.",
  }),
  moniteurIds: z.array(z.string().min(1)).min(1, {
    message: "Au moins un moniteur doit être sélectionné.",
  }),
  categories: z.array(z.nativeEnum(BaptemeCategory)).min(1, {
    message: "Au moins une catégorie doit être sélectionnée.",
  }),
  acomptePrice: z.number().min(0, {
    message: "Le montant de l'acompte doit être positif.",
  }),
});

export const DeleteBaptemeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date doit être une date valide.",
  }),
});
