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
import { VisibleColumns } from "@/app/(post-auth)/dashboard/clients/clients";
import { Client, Order } from "@prisma/client";

interface ClientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  visibleColumns: VisibleColumns;
  toggleColumn: (column: keyof VisibleColumns) => void;
  clients: (Client & {
    orders: Order[];
  })[];
}

export function ClientFilters({
  searchTerm,
  setSearchTerm,
  visibleColumns,
  toggleColumn,
  clients,
}: ClientFiltersProps) {
  // Function to export clients data as CSV
  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      "Id",
      "Nom",
      "Email",
      "Téléphone",
      "Adresse",
      "Code Postal",
      "Ville",
      "Pays",
      "Nombre de commandes",
    ].join(",");

    // Convert each client to CSV row
    const csvRows = clients.map((client) => {
      const values = [
        `"${client.id}"`,
        `"${client.firstName} ${client.lastName}"`,
        `"${client.email}"`,
        `"${client.phone}"`,
        `"${client.address}"`,
        `"${client.postalCode}"`,
        `"${client.city}"`,
        `"${client.country}"`,
        `"${client.orders.length}"`,
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
          placeholder="Rechercher par nom, email, téléphone, ville..."
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
              checked={visibleColumns.phone}
              onCheckedChange={() => toggleColumn("phone")}
            >
              Téléphone
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.address}
              onCheckedChange={() => toggleColumn("address")}
            >
              Adresse
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.ordersCount}
              onCheckedChange={() => toggleColumn("ordersCount")}
            >
              Nb. de commandes
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