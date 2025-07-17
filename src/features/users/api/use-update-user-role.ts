import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.users.changeRole)["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.users.changeRole)["$post"]
>["json"];

export const useUpdateUserRole = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.users.changeRole["$post"]({ json });
      return await response.json();
    },
    onSuccess: (response, json) => {
      if (response.success) {
        toast.success(response.message);

        //Update les queries du role précédent contenu dans json
        queryClient.invalidateQueries({ queryKey: ["users", json.role] });
        //Update les queries du nouveau role contenu dans response.data?.role
        queryClient.invalidateQueries({ queryKey: ["users", response.data?.role] });
        
        router.refresh();
      } else {
        toast.error(response.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
