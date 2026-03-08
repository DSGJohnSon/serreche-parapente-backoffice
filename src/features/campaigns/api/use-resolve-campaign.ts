import { useQuery } from "@tanstack/react-query";

export function useResolveCampaign(id: string, enabled = false) {
  return useQuery({
    queryKey: ["campaign-resolve", id],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/resolve/${id}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la résolution de la campagne");
      }
      const json = await response.json();
      return json.data as {
        contacts: { name: string; phone: string; email?: string }[];
        count: number;
      };
    },
    enabled: !!id && enabled,
  });
}
