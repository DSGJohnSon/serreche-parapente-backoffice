import { z } from "zod";
import { StageType } from "@prisma/client";
import { id } from "date-fns/locale";

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
  moniteurId: z.string().min(1, {
    message: "L'identifiant du moniteur est requis.",
  }),
  price: z.number().min(0, {
    message: "Le prix doit être supérieur ou égal à 0.",
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
  moniteurId: z.string().min(1, {
    message: "L'identifiant du moniteur est requis.",
  }),
  price: z.number().min(0, {
    message: "Le prix doit être supérieur ou égal à 0.",
  }),
});

export const DeleteBaptemeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date doit être une date valide.",
  }),
});
