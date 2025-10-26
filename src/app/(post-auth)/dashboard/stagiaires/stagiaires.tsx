"use client";

import { useState } from "react";
import { StagiaireStats } from "@/features/stagiaires/components/stagiaire-stats";
import { StagiaireFilters } from "@/features/stagiaires/components/stagiaire-filters";
import { StagiaireTable } from "@/features/stagiaires/components/stagiaire-table";
import { StagiairePagination } from "@/features/stagiaires/components/stagiaire-pagination";
import { LucideFrown, LucideRefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useGetAllStagiaires } from "@/features/stagiaires/api/use-get-stagiaires";
import { Stagiaire, StageBooking, BaptemeBooking } from "@prisma/client";

export type SortField =
  | "id"
  | "name"
  | "email"
  | "height"
  | "weight"
  | "phone"
  | "bookingsCount";
export type SortDirection = "asc" | "desc";
export type VisibleColumns = {
  id: boolean;
  name: boolean;
  email: boolean;
  height: boolean;
  weight: boolean;
  phone: boolean;
  bookingsCount: boolean;
};

export function Stagiaires() {
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
    bookingsCount: true,
  });
  const { data: stagiairesData, isLoading: isLoadingStagiaires } =
    useGetAllStagiaires();

  type StagiaireWithBookings = Stagiaire & {
    bookings: (StageBooking | BaptemeBooking)[];
  };

  const transformedStagiairesData: StagiaireWithBookings[] | undefined =
    stagiairesData?.map((stagiaire) => {
      const bookings = [
        ...stagiaire.stageBookings.map((sb) => ({
          ...sb,
          createdAt: new Date(sb.createdAt),
          updatedAt: new Date(sb.updatedAt),
        })),
        ...stagiaire.baptemeBookings.map((bb) => ({
          ...bb,
          createdAt: new Date(bb.createdAt),
          updatedAt: new Date(bb.updatedAt),
        })),
      ];

      return {
        ...stagiaire,
        createdAt: new Date(stagiaire.createdAt),
        updatedAt: new Date(stagiaire.updatedAt),
        birthDate: stagiaire.birthDate ? new Date(stagiaire.birthDate) : null,
        bookings,
      };
    });

  const router = useRouter();

  if (isLoadingStagiaires) {
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
  if (!transformedStagiairesData || transformedStagiairesData === null) {
    return (
      <div className="bg-slate-200 text-slate-800 rounded-md p-8 flex flex-col items-center justify-center border border-slate-400 gap-4">
        <LucideFrown />
        <div className="flex flex-col items-center">
          <p>Aucun stagiaire n&apos;a été trouvé.</p>
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

  // Filter stagiaires based on search term
  const filteredStagiaires = transformedStagiairesData.filter((stagiaire) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      stagiaire.firstName.toLowerCase().includes(searchLower) ||
      stagiaire.lastName.toLowerCase().includes(searchLower) ||
      stagiaire.email.toLowerCase().includes(searchLower) ||
      stagiaire.phone.toLowerCase().includes(searchLower) ||
      stagiaire.id.toLowerCase().includes(searchLower)
    );
  });

  // Sort stagiaires based on sort field and direction
  const sortedStagiaires = [...filteredStagiaires].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    if (sortField === "bookingsCount") {
      aValue = a.bookings.length;
      bValue = b.bookings.length;
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
      <StagiaireStats stagiaires={transformedStagiairesData} />

      <StagiaireFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        stagiaires={sortedStagiaires}
      />

      <StagiaireTable
        stagiaires={sortedStagiaires}
        visibleColumns={visibleColumns}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />

      <StagiairePagination
        totalCount={sortedStagiaires.length}
        filteredCount={sortedStagiaires.length}
      />
    </div>
  );
}