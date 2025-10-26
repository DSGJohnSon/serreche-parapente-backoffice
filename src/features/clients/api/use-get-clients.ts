import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all clients
//*------------------*//
export const useGetAllClients = () => {
  const query = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await client.api.clients.getAll["$get"]();
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
// Get client by ID
/*------------------*/

export const useGetClientById = (id: string) => {
  const query = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const res = await client.api.clients.getById[":id"].$get({ param: { id } });
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