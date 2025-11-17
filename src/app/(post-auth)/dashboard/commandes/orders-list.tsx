"use client";

import { useState } from "react";
import { useGetOrders } from "@/features/orders/api/use-get-orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LucideSearch, LucideExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

const statusColors = {
  PENDING: "bg-yellow-500",
  PAID: "bg-green-500",
  PARTIALLY_PAID: "bg-orange-500",
  FULLY_PAID: "bg-green-700",
  CONFIRMED: "bg-blue-500",
  CANCELLED: "bg-red-500",
  REFUNDED: "bg-gray-500",
};

const statusLabels = {
  PENDING: "En attente",
  PAID: "Payée",
  PARTIALLY_PAID: "Acompte payé",
  FULLY_PAID: "Entièrement payée",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export function OrdersList() {
  const { data: orders, isLoading } = useGetOrders();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders?.filter((order: any) => {
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.client?.firstName?.toLowerCase().includes(query) ||
      order.client?.lastName?.toLowerCase().includes(query) ||
      order.client?.email?.toLowerCase().includes(query)
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
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez toutes les commandes de votre établissement
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher une commande</CardTitle>
          <CardDescription>
            Recherchez par numéro de commande, nom ou email du client
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes</CardTitle>
          <CardDescription>
            {filteredOrders?.length || 0} commande(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredOrders || filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {order.client ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.client.firstName} {order.client.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.client.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.orderItems.map((item: any) => (
                            <Badge key={item.id} variant="outline" className="text-xs">
                              {item.quantity}x {item.type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.totalAmount.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusColors[order.status as keyof typeof statusColors]} text-white`}
                        >
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/reservations?order=${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <LucideExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
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