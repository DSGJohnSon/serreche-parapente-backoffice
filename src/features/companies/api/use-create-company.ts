import { client } from "@/lib/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { companiesMessages } from "../messages";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.companies.create)["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.companies.create)["$post"]
>["json"];

export const useCreateCompany = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.companies.create["$post"]({ json });
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
