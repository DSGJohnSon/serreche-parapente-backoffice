"use client";

import { useState } from "react";
import { ClientStats } from "@/features/clients/components/client-stats";
import { ClientFilters } from "@/features/clients/components/client-filters";
import { ClientTable } from "@/features/clients/components/client-table";
import { ClientPagination } from "@/features/clients/components/client-pagination";
import { LucideFrown, LucideRefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useGetAllClients } from "@/features/clients/api/use-get-clients";
import { Client, Order } from "@prisma/client";

export type SortField =
  | "id"
  | "name"
  | "email"
  | "phone"
  | "address"
  | "postalCode"
  | "city"
  | "country"
  | "ordersCount";
export type SortDirection = "asc" | "desc";
export type VisibleColumns = {
  id: boolean;
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  ordersCount: boolean;
};

export function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    id: true,
    name: true,
    email: true,
    phone: true,
    address: true,
    ordersCount: true,
  });
  const { data: clientsData, isLoading: isLoadingClients } =
    useGetAllClients();

  type ClientWithOrders = Client & {
    orders: Order[];
  };

  const transformedClientsData: ClientWithOrders[] | undefined =
    clientsData?.map((client) => {
      const orders: Order[] = client.orders.map((order) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      }));

      return {
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        orders,
      };
    });

  const router = useRouter();

  if (isLoadingClients) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex gap-4 mb-6">
          <Skeleton className="w-full h-36" />
          <Skeleton className="w-full h-36" />
          <Skeleton className="w-full h-36" />
        </div>
        <div className="w-full h-full">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }
  if (!transformedClientsData || transformedClientsData === null) {
    return (
      <div className="bg-slate-200 text-slate-800 rounded-md p-8 flex flex-col items-center justify-center border border-slate-400 gap-4">
        <LucideFrown />
        <div className="flex flex-col items-center">
          <p>Aucun client n&apos;a été trouvé.</p>
          <p className="text-xs">
            Ceci peut être dû à une erreur de connexion avec la base de données.
          </p>
          <Button
            variant={"secondary"}
            size={"lg"}
            className="mt-4"
            onClick={() => {
              router.refresh();
            }}
          >
            <LucideRefreshCcw />
            Rafraichir la page
          </Button>
        </div>
      </div>
    );
  }

  // Filter clients based on search term
  const filteredClients = transformedClientsData.filter((client) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.toLowerCase().includes(searchLower) ||
      client.city.toLowerCase().includes(searchLower) ||
      client.id.toLowerCase().includes(searchLower)
    );
  });

  // Sort clients based on sort field and direction
  const sortedClients = [...filteredClients].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    if (sortField === "ordersCount") {
      aValue = a.orders.length;
      bValue = b.orders.length;
    } else if (sortField === "name") {
      aValue = `${a.firstName} ${a.lastName}`;
      bValue = `${b.firstName} ${b.lastName}`;
    } else {
      aValue = a[sortField as keyof typeof a] as string | number;
      bValue = b[sortField as keyof typeof b] as string | number;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Toggle column visibility
  const toggleColumn = (column: keyof VisibleColumns) => {
    setVisibleColumns({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  return (
    <div className="space-y-4">
      <ClientStats clients={transformedClientsData} />

      <ClientFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        clients={sortedClients}
      />

      <ClientTable
        clients={sortedClients}
        visibleColumns={visibleColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />

      <ClientPagination
        totalCount={sortedClients.length}
        filteredCount={sortedClients.length}
      />
    </div>
  );
}