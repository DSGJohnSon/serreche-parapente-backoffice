import { z } from "zod";

export const AddCompanySchema = z.object({
  name: z.string().min(1),
  siret: z.string().min(1),
  country: z.string().min(1),
  users: z.array(z.string()),
});

export const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  siret: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  users: z.array(z.string()),
});

export const GetCompaniesByIdsSchema = z.object({
  companyIds: z.array(z.string()),
});
