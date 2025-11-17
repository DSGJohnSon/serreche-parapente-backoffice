import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetDashboardStats = (month?: string) => {
  const query = useQuery({
    queryKey: ["dashboard-stats", month],
    queryFn: async () => {
      const response = await client.api.dashboard.stats.$get({
        query: month ? { month } : {},
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};