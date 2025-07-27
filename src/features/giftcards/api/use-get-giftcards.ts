import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

//*------------------*//
//Get all gift cards
//*------------------*//
export const useGetAllGiftCards = () => {
  const query = useQuery({
    queryKey: ["giftcards"],
    queryFn: async () => {
      const res = await client.api.giftcards.getAll["$get"]();
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
// Get gift card by ID
/*------------------*/
export const useGetGiftCardById = (id: string) => {
  const query = useQuery({
    queryKey: ["giftcard", id],
    queryFn: async () => {
      const res = await client.api.giftcards.getById[":id"].$get({ param: { id } });
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
// Get unused gift cards
/*------------------*/
export const useGetUnusedGiftCards = () => {
  const query = useQuery({
    queryKey: ["giftcards", "unused"],
    queryFn: async () => {
      const res = await client.api.giftcards.getUnused["$get"]();
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
// Get used gift cards
/*------------------*/
export const useGetUsedGiftCards = () => {
  const query = useQuery({
    queryKey: ["giftcards", "used"],
    queryFn: async () => {
      const res = await client.api.giftcards.getUsed["$get"]();
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