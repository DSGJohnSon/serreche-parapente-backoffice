"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  SortDirection,
  SortField,
  VisibleColumns,
} from "@/app/(post-auth)/dashboard/customers/customers";
import { Customer, StageBooking } from "@prisma/client";
import CopyTextComponent from "@/components/copy-text-component";

interface CustomerTableProps {
  customers: (Customer & {
    bookings: StageBooking[];
  })[];
  visibleColumns: VisibleColumns;
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
}

export function CustomerTable({
  customers,
  visibleColumns,
  sortField,
  sortDirection,
  handleSort,
}: CustomerTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.id && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center">
                  Id
                  {sortField === "id" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.name && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Prénom / Nom
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.email && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center">
                  Email
                  {sortField === "email" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.height && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("height")}
              >
                <div className="flex items-center">
                  Taille (m)
                  {sortField === "height" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.weight && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("weight")}
              >
                <div className="flex items-center">
                  Poids (kg)
                  {sortField === "weight" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.phone && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center">
                  Téléphone
                  {sortField === "phone" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.adress && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("adress")}
              >
                <div className="flex items-center">
                  Adresse
                  {sortField === "adress" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.bookingsCount && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("bookingsCount")}
              >
                <div className="flex items-center">
                  Nb. de Réservations
                  {sortField === "bookingsCount" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={
                  Object.values(visibleColumns).filter(Boolean).length + 1
                }
                className="text-center py-8"
              >
                Aucun client trouvé
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                {visibleColumns.id && (
                  <TableCell>
                    <CopyTextComponent text={customer.id} />
                  </TableCell>
                )}
                {visibleColumns.name && (
                  <TableCell className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </TableCell>
                )}
                {visibleColumns.email && (
                  <TableCell>{customer.email}</TableCell>
                )}
                {visibleColumns.height && (
                    <TableCell>
                    {customer.height
                      ? (customer.height / 100).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                      : ""}  m
                    </TableCell>
                )}
                {visibleColumns.weight && (
                  <TableCell>{customer.weight} kg</TableCell>
                )}
                {visibleColumns.phone && (
                  <TableCell>{customer.phone}</TableCell>
                )}
                {visibleColumns.adress && (
                  <TableCell>
                    {customer.adress}, {customer.postalCode} {customer.city},{" "}
                    {customer.country}
                  </TableCell>
                )}
                {visibleColumns.bookingsCount && (
                  <TableCell>{customer.bookings.length}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
