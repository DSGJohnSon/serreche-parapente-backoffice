"use client";

import { client } from "@/lib/rpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

//*------------------*//
//Get all users
//*------------------*//
export const useGetAllUsers = () => {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await client.api.users.getAll["$get"]();
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (!success) {
        toast.error(message);
        return null;
      }
      return { data };
    },
  });
  return query;
};

//*------------------*//
//Get one user by id
//*------------------*//
export const useGetUserById = (id: string) => {
  const query = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await client.api.users.getById[":userId"]["$get"]({
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

//*------------------*//
//Get all users by ids
//*------------------*//
type useGetUsersByIdsResponseType = InferResponseType<
  (typeof client.api.users.getByIds)["$post"]
>;
type useGetUsersByIdsRequestType = InferRequestType<
  (typeof client.api.users.getByIds)["$post"]
>["json"];
export const useGetUsersByIds = () => {
  const mutation = useMutation<
    useGetUsersByIdsResponseType,
    Error,
    useGetUsersByIdsRequestType
  >({
    mutationFn: async (json) => {
      const response = await client.api.users.getByIds["$post"]({ json });
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
      toast.error(JSON.stringify(error));
    },
  });

  return mutation;
};
