import { z } from "zod";
import { StageType } from "@prisma/client";
import { id } from "date-fns/locale";

export const CreateStageSchema = z.object({
  year: z
    .number()
    .int()
    .min(2000, { message: "L'année doit être supérieure ou égale à 2000." })
    .max(2200, { message: "L'année doit être inférieure ou égale à 2200." }),
  weekNumber: z
    .number()
    .int()
    .min(1, {
      message: "Le numéro de la semaine doit être supérieur ou égal à 1.",
    })
    .max(53, {
      message: "Le numéro de la semaine doit être inférieur ou égal à 53.",
    }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date de début doit être une date valide.",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date de fin doit être une date valide.",
  }),
  type: z.nativeEnum(StageType, {
    message: "Le type de la semaine doit être valide.",
  }),
});

export const UpdateStageSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date de début doit être une date valide.",
  }),
  previousType: z.nativeEnum(StageType, {
    message: "Le type précédent de la semaine doit être valide.",
  }),
  type: z.nativeEnum(StageType, {
    message: "Le type de la semaine doit être valide.",
  }),
  places: z.number().int(),
});

export const DeleteStageSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date de début doit être une date valide.",
  }),
});
