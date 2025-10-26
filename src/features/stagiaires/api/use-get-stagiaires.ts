import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all stagiaires
//*------------------*//
export const useGetAllStagiaires = () => {
  const query = useQuery({
    queryKey: ["stagiaires"],
    queryFn: async () => {
      const res = await client.api.stagiaires.getAll["$get"]();
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
// Get stagiaire by ID
/*------------------*/

export const useGetStagiaireById = (id: string) => {
  const query = useQuery({
    queryKey: ["stagiaire", id],
    queryFn: async () => {
      const res = await client.api.stagiaires.getById[":id"].$get({ param: { id } });
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