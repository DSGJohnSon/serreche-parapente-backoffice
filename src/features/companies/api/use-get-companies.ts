"use client";

import { client } from "@/lib/rpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

//*------------------*//
//Get all companies
//*------------------*//
export const useGetAllCompanies = () => {
  const query = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await client.api.companies.getAll["$get"]();
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (success) {
        toast.error(message);
        return null;
      }
      return data;
    },
  });

  return query;
};
//
//*------------------*//
//Get one company by id
//*------------------*//
export const useGetCompanyById = (id: string) => {
  const query = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const res = await client.api.companies.getById[":companyId"]["$get"]({
        param: {
          companyId: id,
        },
      });
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (!success) {
        toast.error(message);
        return null;
      }
      return data;
    },
  });
  return query;
};
//
//*------------------*//
//Get companies by user id
//*------------------*//
export const useGetCompaniesByUserId = (id: string) => {
  const query = useQuery({
    queryKey: ["companyByUserId", id],
    queryFn: async () => {
      const res = await client.api.companies.getByUserId[":userId"]["$get"]({
        param: {
          userId: id,
        },
      });
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (!success) {
        toast.error(message);
        return null;
      }
      return data;
    },
  });
  return query;
};
//
//*------------------*//
//Get all companies by ids
//*------------------*//
type useGetUsersByIdsResponseType = InferResponseType<
  (typeof client.api.companies.getByIds)["$post"]
>;
type useGetUsersByIdsRequestType = InferRequestType<
  (typeof client.api.companies.getByIds)["$post"]
>["json"];
export const useGetCompaniesByIds = () => {
  const mutation = useMutation<
    useGetUsersByIdsResponseType,
    Error,
    useGetUsersByIdsRequestType
  >({
    mutationFn: async (json) => {
      const response = await client.api.companies.getByIds["$post"]({ json });
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
