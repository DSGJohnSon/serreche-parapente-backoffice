import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetMoniteursAndAdmins = () => {
  const query = useQuery({
    queryKey: ["moniteurs-and-admins"],
    queryFn: async () => {
      // Récupérer les moniteurs et les admins en parallèle
      const [moniteursResponse, adminsResponse] = await Promise.all([
        client.api.users.getByRole[":role"].$get({
          param: { role: "MONITEUR" }
        }),
        client.api.users.getByRole[":role"].$get({
          param: { role: "ADMIN" }
        })
      ]);

      if (!moniteursResponse.ok || !adminsResponse.ok) {
        throw new Error("Failed to fetch moniteurs and admins");
      }

      const [moniteursResult, adminsResult] = await Promise.all([
        moniteursResponse.json(),
        adminsResponse.json()
      ]);

      if (!moniteursResult.success || !adminsResult.success) {
        throw new Error("Failed to fetch moniteurs and admins");
      }

      // Combiner les deux listes et éliminer les doublons par ID
      const combined = [...(moniteursResult.data || []), ...(adminsResult.data || [])];
      const uniqueUsers = combined.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      // Transformer les données pour s'assurer que les dates sont des objets Date
      const transformedData = uniqueUsers.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      }));

      return transformedData;
    },
  });

  return query;
};