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
import { VisibleColumns } from "@/app/(post-auth)/dashboard/customers/customers";
interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  visibleColumns: VisibleColumns;
  toggleColumn: (column: keyof VisibleColumns) => void;
  customers: any[];
}

export function CustomerFilters({
  searchTerm,
  setSearchTerm,
  visibleColumns,
  toggleColumn,
  customers,
}: CustomerFiltersProps) {
  // Function to export customers data as CSV
  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      "Id",
      "Nom",
      "Email",
      "Taille (cm)",
      "Poids (kg)",
      "Téléphone",
      "Adresse",
      "Code Postal",
      "Ville",
      "Pays",
      "Nombre de réservations",
    ].join(",");

    // Convert each customer to CSV row
    const csvRows = customers.map((customer) => {
      const values = [
        `"${customer.id}"`,
        `"${customer.firstName} ${customer.lastName}"`,
        `"${customer.email}"`,
        `"${customer.height}"`,
        `"${customer.weight}"`,
        `"${customer.phone}"`,
        `"${customer.adress}"`,
        `"${customer.postalCode}"`,
        `"${customer.city}"`,
        `"${customer.country}"`,
        `"${customer.bookings.length}"`,
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
      `clients_export_${new Date().toISOString().split("T")[0]}.csv`
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
          placeholder="Rechercher par nom, email, téléphone, ville, pays..."
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
              checked={visibleColumns.adress}
              onCheckedChange={() => toggleColumn("adress")}
            >
              Adresse
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
