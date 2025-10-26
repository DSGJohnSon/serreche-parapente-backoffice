"use client";

import { Download, SearchIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisibleColumns } from "@/app/(post-auth)/dashboard/stagiaires/stagiaires";
import { Stagiaire, StageBooking, BaptemeBooking } from "@prisma/client";

interface StagiaireFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  visibleColumns: VisibleColumns;
  toggleColumn: (column: keyof VisibleColumns) => void;
  stagiaires: (Stagiaire & {
    bookings: (StageBooking | BaptemeBooking)[];
  })[];
}

export function StagiaireFilters({
  searchTerm,
  setSearchTerm,
  visibleColumns,
  toggleColumn,
  stagiaires,
}: StagiaireFiltersProps) {
  // Function to export stagiaires data as CSV
  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      "Id",
      "Nom",
      "Email",
      "Taille (cm)",
      "Poids (kg)",
      "Téléphone",
      "Nombre de réservations",
    ].join(",");

    // Convert each stagiaire to CSV row
    const csvRows = stagiaires.map((stagiaire) => {
      const values = [
        `"${stagiaire.id}"`,
        `"${stagiaire.firstName} ${stagiaire.lastName}"`,
        `"${stagiaire.email}"`,
        `"${stagiaire.height}"`,
        `"${stagiaire.weight}"`,
        `"${stagiaire.phone}"`,
        `"${stagiaire.bookings.length}"`,
      ];
      return values.join(",");
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `stagiaires_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="relative w-full sm:w-96">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email, téléphone..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={visibleColumns.id}
              onCheckedChange={() => toggleColumn("id")}
            >
              Id
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.name}
              onCheckedChange={() => toggleColumn("name")}
            >
              Prénom / Nom
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.email}
              onCheckedChange={() => toggleColumn("email")}
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.height}
              onCheckedChange={() => toggleColumn("height")}
            >
              Taille (m)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.weight}
              onCheckedChange={() => toggleColumn("weight")}
            >
              Poids (kg)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.phone}
              onCheckedChange={() => toggleColumn("phone")}
            >
              Téléphone
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.bookingsCount}
              onCheckedChange={() => toggleColumn("bookingsCount")}
            >
              Nb. de réservations
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={exportToCSV}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>
    </div>
  );
}