import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.giftcards.create["$post"]>;
type RequestType = InferRequestType<typeof client.api.giftcards.create["$post"]>["json"];

export const useCreateGiftCard = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.giftcards.create["$post"]({ json });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["giftcards"] });
        queryClient.invalidateQueries({ queryKey: ["giftcards", "unused"] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Erreur lors de la création du bon cadeau");
    },
  });

  return mutation;
};