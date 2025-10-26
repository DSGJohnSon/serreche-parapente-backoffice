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
} from "@/app/(post-auth)/dashboard/clients/clients";
import { Client, Order } from "@prisma/client";
import CopyTextComponent from "@/components/copy-text-component";
import Link from "next/link";

interface ClientTableProps {
  clients: (Client & {
    orders: Order[];
  })[];
  visibleColumns: VisibleColumns;
  sortField: SortField;
  sortDirection: SortDirection;
  handleSort: (field: SortField) => void;
}

export function ClientTable({
  clients,
  visibleColumns,
  sortField,
  sortDirection,
  handleSort,
}: ClientTableProps) {
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
            {visibleColumns.address && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("address")}
              >
                <div className="flex items-center">
                  Adresse
                  {sortField === "address" &&
                    (sortDirection === "asc" ? (
                      <ArrowUpIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-2 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
            )}
            {visibleColumns.ordersCount && (
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("ordersCount")}
              >
                <div className="flex items-center">
                  Nb. de Commandes
                  {sortField === "ordersCount" &&
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
          {clients.length === 0 ? (
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
            clients.map((client) => (
              <TableRow key={client.id}>
                {visibleColumns.id && (
                  <TableCell>
                    <CopyTextComponent text={client.id} />
                  </TableCell>
                )}
                {visibleColumns.name && (
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="underline"
                    >
                      {client.firstName} {client.lastName}
                    </Link>
                  </TableCell>
                )}
                {visibleColumns.email && (
                  <TableCell>{client.email}</TableCell>
                )}
                {visibleColumns.phone && (
                  <TableCell>{client.phone}</TableCell>
                )}
                {visibleColumns.address && (
                  <TableCell>
                    {client.address}, {client.postalCode} {client.city},{" "}
                    {client.country}
                  </TableCell>
                )}
                {visibleColumns.ordersCount && (
                  <TableCell>{client.orders.length}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}