import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCustomer } from "../actions";

type RequestType = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  adress: string;
  postalCode: string;
  city: string;
  country: string;
  height: number;
  weight: number;
};

export const useCreateCustomer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, RequestType>({
    mutationFn: async (data) => {
      return await createCustomer(data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        router.refresh();
      } else {
        toast.error(response.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du client");
    },
  });

  return mutation;
};
