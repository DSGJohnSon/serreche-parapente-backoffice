import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCurrent = () => {
  const query = useQuery({
    queryKey: ["current"],
    queryFn: async () => {
      const res = await client.api.auth.current.$get();

      if (!res.ok) {
        toast.error("Error fetching current user");
        return null;
      }

      const response = await res.json();

      if (!response.success) {
        // toast.error(response.message);
        return null;
      }

      return response.data;
    },
  });

  return query;
};
