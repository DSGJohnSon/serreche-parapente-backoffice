"use client";

import { useState } from "react";
import { useGetPayments } from "@/features/payments/api/use-get-payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LucideSearch, LucideCalendar, LucideEuro, LucideCreditCard, LucideUser } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CopyTextComponent from "@/components/copy-text-component";

const paymentMethodLabels = {
  CARD: "Carte bancaire",
  BANK_TRANSFER: "Virement bancaire",
  CASH: "Espèces",
  CHECK: "Chèque",
};

const itemTypeLabels = {
  STAGE: "Stage",
  BAPTEME: "Baptême",
  GIFT_CARD: "Carte cadeau",
};

const stageTypeLabels = {
  INITIATION: "Initiation",
  PROGRESSION: "Progression",
  AUTONOMIE: "Autonomie",
  DOUBLE: "Double",
};

const baptemeCategoryLabels = {
  AVENTURE: "Aventure",
  DUREE: "Durée",
  LONGUE_DUREE: "Longue durée",
  ENFANT: "Enfant",
  HIVER: "Hiver",
};

export function PaymentsList() {
  const { data: payments, isLoading } = useGetPayments();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments?.filter((payment: any) => {
    const query = searchQuery.toLowerCase();
    return (
      payment.order?.orderNumber?.toLowerCase().includes(query) ||
      payment.order?.client?.firstName?.toLowerCase().includes(query) ||
      payment.order?.client?.lastName?.toLowerCase().includes(query) ||
      payment.order?.client?.email?.toLowerCase().includes(query) ||
      payment.stripePaymentIntentId?.toLowerCase().includes(query) ||
      payment.recordedByUser?.name?.toLowerCase().includes(query) ||
      payment.recordedByUser?.email?.toLowerCase().includes(query)
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

  // Calculate stats
  const totalPayments = payments?.length || 0;
  const stripePayments = payments?.filter((p: any) => !p.isManual).length || 0;
  const manualPayments = payments?.filter((p: any) => p.isManual).length || 0;
  const totalAmount = payments
    ?.filter((p: any) => p.status === "SUCCEEDED")
    .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground">
            Consultez tous les paiements enregistrés (Stripe et manuels)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un paiement</CardTitle>
          <CardDescription>
            Recherchez par numéro de commande, nom du client, email, ID de transaction ou administrateur
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des paiements</CardTitle>
          <CardDescription>
            {filteredPayments?.length || 0} paiement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredPayments || filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(payment.createdAt), "HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{payment.order?.orderNumber || "-"}</span>
                          {payment.order?.client ? (
                            <span className="text-xs text-muted-foreground">
                              {payment.order.client.firstName} {payment.order.client.lastName}
                            </span>
                          ) : payment.allocations?.[0]?.orderItem?.stageBooking?.stagiaire ? (
                            <span className="text-xs text-muted-foreground">
                              {payment.allocations[0].orderItem.stageBooking.stagiaire.firstName} {payment.allocations[0].orderItem.stageBooking.stagiaire.lastName}
                            </span>
                          ) : payment.allocations?.[0]?.orderItem?.baptemeBooking?.stagiaire ? (
                            <span className="text-xs text-muted-foreground">
                              {payment.allocations[0].orderItem.baptemeBooking.stagiaire.firstName} {payment.allocations[0].orderItem.baptemeBooking.stagiaire.lastName}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.isManual ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit">
                              Manuel
                            </Badge>
                            {payment.manualPaymentMethod && (
                              <span className="text-xs text-muted-foreground">
                                {paymentMethodLabels[payment.manualPaymentMethod as keyof typeof paymentMethodLabels]}
                              </span>
                            )}
                            {payment.recordedByUser && (
                              <span className="text-xs text-muted-foreground">
                                Par: {payment.recordedByUser.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit bg-blue-50">
                              Stripe
                            </Badge>
                            {payment.stripePaymentIntentId && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {payment.stripePaymentIntentId}
                                </span>
                                <CopyTextComponent text={payment.stripePaymentIntentId} size="sm" />
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.amount.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {payment.allocations && payment.allocations.length > 0 ? (
                            <div className="space-y-1">
                              {payment.allocations.length > 1 && (
                                <span className="text-xs font-medium text-muted-foreground">Allocations:</span>
                              )}
                              {payment.allocations.map((allocation: any) => {
                                const participantData = allocation.orderItem.participantData as any;
                                return (
                                  <div key={allocation.id} className="text-xs space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {itemTypeLabels[allocation.orderItem.type as keyof typeof itemTypeLabels]}
                                      </Badge>
                                      <span className="font-medium">{allocation.allocatedAmount.toFixed(2)}€</span>
                                    </div>
                                    {allocation.orderItem.type === "STAGE" && allocation.orderItem.stage && (
                                      <div className="text-muted-foreground">
                                        Stage {stageTypeLabels[allocation.orderItem.stage.type as keyof typeof stageTypeLabels]} du {format(new Date(allocation.orderItem.stage.startDate), "dd/MM/yyyy", { locale: fr })}
                                      </div>
                                    )}
                                    {allocation.orderItem.type === "BAPTEME" && allocation.orderItem.bapteme && (
                                      <div className="text-muted-foreground">
                                        Baptême {participantData?.selectedCategory ? baptemeCategoryLabels[participantData.selectedCategory as keyof typeof baptemeCategoryLabels] : ""} du {format(new Date(allocation.orderItem.bapteme.date), "dd/MM/yyyy", { locale: fr })}
                                      </div>
                                    )}
                                    {allocation.orderItem.type === "GIFT_CARD" && (
                                      <div className="text-muted-foreground">
                                        Carte cadeau de {allocation.orderItem.giftCardAmount?.toFixed(2)}€
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucune allocation</span>
                          )}
                          {payment.manualPaymentNote && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Note:</span> {payment.manualPaymentNote}
                            </div>
                          )}
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