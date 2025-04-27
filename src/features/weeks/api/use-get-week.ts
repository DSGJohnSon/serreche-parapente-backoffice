"use client";

import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

//*------------------*//
//Get all weeks
//*------------------*//
export const useGetAllWeeks = () => {
  const query = useQuery({
    queryKey: ["weeks"],
    queryFn: async () => {
      const response = await client.api.weeks.getAll["$get"]({
        query: {
          includeBookings: "true", // Ajoutez ce paramètre pour inclure les réservations
        },
      });
      if (!response.ok) {
        return null;
      }
      const { data } = await response.json();
      return { data };
    },
  });

  return query;
};
