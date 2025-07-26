import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export const useUpdateBapteme = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: {
      originalDate: string;
      date: string;
      duration: number;
      places: number;
      moniteurId: string;
      price: number;
    }) => {
      const response = await client.api.baptemes.update.$post({
        json: {
          originalDate: data.originalDate,
          date: data.date,
          duration: data.duration,
          places: data.places,
          moniteurId: data.moniteurId,
          price: data.price,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update bapteme");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update bapteme");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success("Baptême mis à jour avec succès");
      // Invalidate and refetch baptemes
      queryClient.invalidateQueries({ queryKey: ["baptemes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour du baptême");
    },
  });

  return mutation;
};
