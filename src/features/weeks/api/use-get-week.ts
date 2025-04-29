"use client";

import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all weeks
//*------------------*//
export const useGetAllWeeks = () => {
  const query = useQuery({
    queryKey: ["weeks"],
    queryFn: async () => {
      const res = await client.api.weeks.getAll["$get"]({
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
