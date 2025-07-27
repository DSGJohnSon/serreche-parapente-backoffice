import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.giftcards.use[":id"]["$put"]>;
type RequestType = InferRequestType<typeof client.api.giftcards.use[":id"]["$put"]>["json"];

export const useUseGiftCard = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType & { id: string }>({
    mutationFn: async ({ id, ...json }) => {
      const response = await client.api.giftcards.use[":id"]["$put"]({ 
        param: { id },
        json 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["giftcards"] });
        queryClient.invalidateQueries({ queryKey: ["giftcards", "unused"] });
        queryClient.invalidateQueries({ queryKey: ["giftcards", "used"] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Erreur lors de l'utilisation du bon cadeau");
    },
  });

  return mutation;
};