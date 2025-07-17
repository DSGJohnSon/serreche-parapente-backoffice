import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all customers
//*------------------*//
export const useGetAllCustomers = () => {
  const query = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await client.api.customers.getAll["$get"]();
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (!success) {
        toast.error(message);
        return null;
      }
      return data;
    },
  });

  return query;
};

/*------------------*/
// Get customer by ID
/*------------------*/

export const useGetCustomerById = (id: string) => {
  const query = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await client.api.customers.getById[":id"].$get({ param: { id } });
      if (!res.ok) {
        return null;
      }

      const { success, message, data } = await res.json();
      if (!success) {
        toast.error(message);
        return null;
      }
      return data;
    },
  });

  return query;
};
