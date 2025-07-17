"use client";

import { useState } from "react";
import { CustomerStats } from "@/features/customers/components/customer-stats";
import { CustomerFilters } from "@/features/customers/components/customer-filters";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { CustomerPagination } from "@/features/customers/components/customer-pagination";
import { LucideFrown, LucideRefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useGetAllCustomers } from "@/features/customers/api/use-get-customers";
import { Customer, StageBooking } from "@prisma/client";

export type SortField =
  | "id"
  | "name"
  | "email"
  | "height"
  | "weight"
  | "phone"
  | "adress"
  | "postalCode"
  | "city"
  | "country"
  | "bookingsCount";
export type SortDirection = "asc" | "desc";
export type VisibleColumns = {
  id: boolean;
  name: boolean;
  email: boolean;
  height: boolean;
  weight: boolean;
  phone: boolean;
  adress: boolean;
  bookingsCount: boolean;
};

export function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    id: true,
    name: true,
    email: true,
    height: true,
    weight: true,
    phone: true,
    adress: true,
    bookingsCount: true,
  });
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetAllCustomers();

  type CustomerWithBookings = Customer & {
    bookings: StageBooking[];
  };

  const transformedCustomersData: CustomerWithBookings[] | undefined =
    customersData?.map((customer) => {
      const bookings: StageBooking[] = customer.stages.map((sb) => ({
        id: sb.id,
        stageId: sb.stageId,
        customerId: sb.customerId,
        type: sb.type,
        createdAt: new Date(sb.createdAt),
        updatedAt: new Date(sb.updatedAt),
      }));

      return {
        ...customer,
        createdAt: new Date(customer.createdAt),
        updatedAt: new Date(customer.updatedAt),
        birthDate: customer.birthDate ? new Date(customer.birthDate) : null,
        bookings,
      };
    });

  const router = useRouter();

  if (isLoadingCustomers) {
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
  if (!transformedCustomersData || transformedCustomersData === null) {
    return (
      <div className="bg-slate-200 text-slate-800 rounded-md p-8 flex flex-col items-center justify-center border border-slate-400 gap-4">
        <LucideFrown />
        <div className="flex flex-col items-center">
          <p>Aucun client n&apos;a été trouvé.</p>
          <p className="text-xs">
            Ceci peut être dû à une erreur de connexion avec la base donneées.
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

  // Filter customers based on search term
  const filteredCustomers = transformedCustomersData.filter((customer) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.city.toLowerCase().includes(searchLower) ||
      customer.id.toLowerCase().includes(searchLower)
    );
  });

  // Sort customers based on sort field and direction
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    aValue = a[sortField as keyof typeof a] as string | number;
    bValue = b[sortField as keyof typeof b] as string | number;

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
      <CustomerStats customers={transformedCustomersData} />

      <CustomerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        customers={sortedCustomers}
      />

      <CustomerTable
        customers={sortedCustomers}
        visibleColumns={visibleColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />

      <CustomerPagination
        totalCount={sortedCustomers.length}
        filteredCount={sortedCustomers.length}
      />
    </div>
  );
}
