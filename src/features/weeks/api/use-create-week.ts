import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.weeks.create)["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.weeks.create)["$post"]
>["json"];

export const useCreateWeek = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.weeks.create["$post"]({ json });
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
      queryClient.invalidateQueries({ queryKey: ["weeks"] });
    },
    onError: (error: Error) => {
      console.log(error);
      toast.error(JSON.stringify(error));
    },
  });

  return mutation;
};
