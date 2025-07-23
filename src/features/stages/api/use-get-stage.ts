"use client";

import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all stages
//*------------------*//
export const useGetAllStages = () => {
  const query = useQuery({
    queryKey: ["weeks"],
    queryFn: async () => {
      const res = await client.api.stages.getAll["$get"]({
        query: {
          includeBookings: "true",
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

export const useGetStageById = (id: string) => {
  const query = useQuery({
    queryKey: ["stage", id],
    queryFn: async () => {
      const res = await client.api.stages.getById[":id"].$get({ param: { id } });
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
