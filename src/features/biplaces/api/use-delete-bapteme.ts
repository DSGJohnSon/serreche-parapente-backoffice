import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

export const useDeleteBapteme = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { date: string }) => {
      const response = await client.api.baptemes.delete.$post({
        json: data,
      });

      if (!response.ok) {
        throw new Error("Failed to delete bapteme");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete bapteme");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success("Baptême supprimé avec succès");
      // Invalidate and refetch baptemes
      queryClient.invalidateQueries({ queryKey: ["baptemes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression du baptême");
    },
  });

  return mutation;
};
