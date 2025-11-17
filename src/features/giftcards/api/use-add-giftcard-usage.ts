import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export const useAddGiftCardUsage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      orderId,
      usedAmount,
    }: {
      id: string;
      orderId: string;
      usedAmount: number;
    }) => {
      const response = await client.api.giftcards["addUsage"][":id"].$post({
        param: { id },
        json: { orderId, usedAmount },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add gift card usage");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Utilisation ajoutée avec succès");
      queryClient.invalidateQueries({ queryKey: ["giftcards"] });
      queryClient.invalidateQueries({ queryKey: ["giftcard-history"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout de l'utilisation");
    },
  });

  return mutation;
};