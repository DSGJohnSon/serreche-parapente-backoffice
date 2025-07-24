"use client";

import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all baptemes
//*------------------*//
export const useGetAllBaptemes = () => {
  const query = useQuery({
    queryKey: ["baptemes"],
    queryFn: async () => {
      const res = await client.api.baptemes.getAll["$get"]({
        // query: {
        //   includeBookings: "true",
        // },
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

export const useGetBaptemeById = (id: string) => {
  const query = useQuery({
    queryKey: ["bapteme", id],
    queryFn: async () => {
      const res = await client.api.baptemes.getById[":id"].$get({ param: { id } });
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
