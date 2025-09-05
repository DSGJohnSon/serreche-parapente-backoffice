import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.stages.delete)["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.stages.delete)["$post"]
>["json"];

export const useDeleteStage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.stages.delete["$post"]({ json });
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: ["stages"] });
        router.refresh();
      } else {
        toast.error(response.message);
      }
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la suppression du stage");
      console.error(error);
    },
  });

  return mutation;
};
