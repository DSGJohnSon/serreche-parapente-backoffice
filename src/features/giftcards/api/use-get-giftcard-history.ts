import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetGiftCardHistory = (id: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["giftcard-history", id],
    queryFn: async () => {
      const response = await client.api.giftcards["getHistory"][":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch gift card history");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};