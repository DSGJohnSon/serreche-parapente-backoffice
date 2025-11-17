"use client";

import { useState } from "react";
import { useGetAllClients } from "@/features/clients/api/use-get-clients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LucideSearch, LucideUser, LucideMail, LucidePhone, LucideMapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Client, Order } from "@prisma/client";
import CopyTextComponent from "@/components/copy-text-component";

type ClientWithOrders = Client & {
  orders: Order[];
};

export function ClientsList() {
  const { data: clientsData, isLoading } = useGetAllClients();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredClients = transformedClientsData?.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      client.city.toLowerCase().includes(query) ||
      client.id.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez tous les clients de votre établissement
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un client</CardTitle>
          <CardDescription>
            Recherchez par nom, email, téléphone ou ville
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <LucideSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {filteredClients?.length || 0} client(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredClients || filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <LucideUser className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {client.firstName} {client.lastName}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                ID: {client.id.slice(0, 8)}...
                              </span>
                              <CopyTextComponent text={client.id} size="sm" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            <LucideMail className="h-3 w-3 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <LucidePhone className="h-3 w-3 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <LucideMapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <div className="flex flex-col text-sm">
                            <span>{client.address}</span>
                            <span className="text-muted-foreground">
                              {client.postalCode} {client.city}
                            </span>
                            <span className="text-muted-foreground">{client.country}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {client.orders.length} commande{client.orders.length > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(client.createdAt), "HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}