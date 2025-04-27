import { Company } from "@prisma/client";
import { User } from "@prisma/client";

export type CompanyTypeReturned = Company & {
  users: User[];
};
