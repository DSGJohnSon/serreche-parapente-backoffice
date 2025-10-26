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
import {
  SortDirection,
  SortField,
  VisibleColumns,
} from "@/app/(post-auth)/dashboard/stagiaires/stagiaires";
import { Stagiaire, StageBooking, BaptemeBooking } from "@prisma/client";
import CopyTextComponent from "@/components/copy-text-component";
import Link from "next/link";

interface StagiaireTableProps {
  stagiaires: (Stagiaire & {
    bookings: (StageBooking | BaptemeBooking)[];
  })[];
  visibleColumns: VisibleColumns;
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
}

export function StagiaireTable({
  stagiaires,
  visibleColumns,
  sortField,
  sortDirection,
  handleSort,
}: StagiaireTableProps) {
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
          {stagiaires.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={
                  Object.values(visibleColumns).filter(Boolean).length + 1
                }
                className="text-center py-8"
              >
                Aucun stagiaire trouvé
              </TableCell>
            </TableRow>
          ) : (
            stagiaires.map((stagiaire) => (
              <TableRow key={stagiaire.id}>
                {visibleColumns.id && (
                  <TableCell>
                    <CopyTextComponent text={stagiaire.id} />
                  </TableCell>
                )}
                {visibleColumns.name && (
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/stagiaires/${stagiaire.id}`}
                      className="underline"
                    >
                      {stagiaire.firstName} {stagiaire.lastName}
                    </Link>
                  </TableCell>
                )}
                {visibleColumns.email && (
                  <TableCell>{stagiaire.email}</TableCell>
                )}
                {visibleColumns.height && (
                  <TableCell>
                    {stagiaire.height
                      ? (stagiaire.height / 100).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : ""}{" "}
                    m
                  </TableCell>
                )}
                {visibleColumns.weight && (
                  <TableCell>{stagiaire.weight} kg</TableCell>
                )}
                {visibleColumns.phone && (
                  <TableCell>{stagiaire.phone}</TableCell>
                )}
                {visibleColumns.bookingsCount && (
                  <TableCell>{stagiaire.bookings.length}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}