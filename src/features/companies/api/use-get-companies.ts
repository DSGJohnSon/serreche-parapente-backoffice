"use client";

import { client } from "@/lib/rpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

//*------------------*//
//Get all companies
//*------------------*//
export const useGetAllCompanies = () => {
  const query = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await client.api.companies.getAll["$get"]();
      if (!response.ok) {
        return null;
      }
      const { data } = await response.json();
      return { data };
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
      const response = await client.api.companies.getById[":companyId"]["$get"](
        {
          param: {
            companyId: id,
          },
        }
      );
      if (!response.ok) {
        return null;
      }

      const { data } = await response.json();
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
      const response = await client.api.companies.getByUserId[":userId"][
        "$get"
      ]({
        param: {
          userId: id,
        },
      });
      if (!response.ok) {
        return null;
      }

      const { data } = await response.json();
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
  });

  return mutation;
};
