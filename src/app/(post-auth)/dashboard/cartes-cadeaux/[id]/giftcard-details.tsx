"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetGiftCardHistory } from "@/features/giftcards/api/use-get-giftcard-history";
import { useAddGiftCardUsage } from "@/features/giftcards/api/use-add-giftcard-usage";
import { useSearchOrders } from "@/features/orders/api/use-search-orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LucideArrowLeft, LucideCalendar, LucideGift, LucideHistory, LucidePlus, LucideUser, LucideSearch } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface GiftCardDetailsProps {
  id: string;
}

export function GiftCardDetails({ id }: GiftCardDetailsProps) {
  const router = useRouter();
  const { data: giftCard, isLoading } = useGetGiftCardHistory(id);
  const addUsage = useAddGiftCardUsage();
  
  const [showAddUsageDialog, setShowAddUsageDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [usedAmount, setUsedAmount] = useState<number>(0);

  const { data: searchResults, isLoading: isSearching } = useSearchOrders(searchQuery);

  // Reset search when dialog closes
  useEffect(() => {
    if (!showAddUsageDialog) {
      setSearchQuery("");
      setSelectedOrder(null);
      setUsedAmount(0);
    }
  }, [showAddUsageDialog]);

  const handleAddUsage = async () => {
    if (!selectedOrder || usedAmount <= 0) {
      alert("Veuillez sélectionner une commande et entrer un montant");
      return;
    }

    try {
      await addUsage.mutateAsync({
        id,
        orderId: selectedOrder.id,
        usedAmount,
      });
      setShowAddUsageDialog(false);
      setSearchQuery("");
      setSelectedOrder(null);
      setUsedAmount(0);
    } catch (error) {
      console.error("Error adding usage:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg text-muted-foreground">Carte cadeau introuvable</p>
        <Button onClick={() => router.push("/dashboard/cartes-cadeaux")}>
          <LucideArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const remainingAmount = giftCard.remainingAmount || giftCard.amount;
  const totalUsed = giftCard.amount - remainingAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/cartes-cadeaux")}
          >
            <LucideArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Détails de la Carte Cadeau</h1>
            <p className="text-muted-foreground">
              Code: <code className="bg-muted px-2 py-1 rounded">{giftCard.code}</code>
            </p>
          </div>
        </div>
        <Dialog open={showAddUsageDialog} onOpenChange={setShowAddUsageDialog}>
          <DialogTrigger asChild>
            <Button disabled={giftCard.isUsed || remainingAmount <= 0}>
              <LucidePlus className="h-4 w-4 mr-2" />
              Ajouter une utilisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une utilisation</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle utilisation de cette carte cadeau pour une commande.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rechercher une commande *</Label>
                {selectedOrder ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <div className="flex-1">
                      <div className="font-medium">{selectedOrder.orderNumber}</div>
                      {selectedOrder.client && (
                        <div className="text-sm text-muted-foreground">
                          {selectedOrder.client.firstName} {selectedOrder.client.lastName}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      disabled={addUsage.isPending}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <Command className="border rounded-md">
                    <CommandInput
                      placeholder="Rechercher par numéro de commande ou nom de client..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {isSearching ? (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          Recherche en cours...
                        </div>
                      ) : searchQuery.length < 2 ? (
                        <CommandEmpty>
                          Entrez au moins 2 caractères pour rechercher
                        </CommandEmpty>
                      ) : !searchResults || searchResults.length === 0 ? (
                        <CommandEmpty>Aucune commande trouvée</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {searchResults.map((order: any) => (
                            <CommandItem
                              key={order.id}
                              onSelect={() => setSelectedOrder(order)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{order.orderNumber}</span>
                                  <Badge variant="outline">{order.status}</Badge>
                                </div>
                                {order.client && (
                                  <div className="text-sm text-muted-foreground">
                                    {order.client.firstName} {order.client.lastName} - {order.client.email}
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: fr })}</span>
                                  <span>{order.totalAmount.toFixed(2)}€</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="usedAmount">Montant utilisé (€) *</Label>
                <Input
                  id="usedAmount"
                  type="number"
                  min="0.01"
                  max={remainingAmount}
                  step="0.01"
                  value={usedAmount || ""}
                  onChange={(e) => setUsedAmount(parseFloat(e.target.value) || 0)}
                  placeholder={`Max: ${remainingAmount.toFixed(2)}€`}
                  disabled={addUsage.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Solde disponible: {remainingAmount.toFixed(2)}€
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddUsageDialog(false)}
                  disabled={addUsage.isPending}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddUsage}
                  disabled={addUsage.isPending}
                  className="flex-1"
                >
                  {addUsage.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gift Card Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Initial</CardTitle>
            <LucideGift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giftCard.amount.toFixed(2)}€</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Utilisé</CardTitle>
            <LucideHistory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalUsed.toFixed(2)}€</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Restant</CardTitle>
            <LucideGift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{remainingAmount.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Statut</span>
            <Badge variant={giftCard.isUsed ? "destructive" : "secondary"}>
              {giftCard.isUsed ? "Épuisé" : "Actif"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Date de création</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(giftCard.createdAt), "dd MMMM yyyy", { locale: fr })}
            </span>
          </div>
          {giftCard.usedAt && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Première utilisation</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(giftCard.usedAt), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
            </>
          )}
          {giftCard.client && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Acheté par</span>
                <Link
                  href={`/dashboard/clients/${giftCard.client.id}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <LucideUser className="h-3 w-3" />
                  {giftCard.client.firstName} {giftCard.client.lastName}
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique d&apos;utilisation</CardTitle>
          <CardDescription>
            {giftCard.appliedToOrders?.length || 0} utilisation(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!giftCard.appliedToOrders || giftCard.appliedToOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune utilisation enregistrée
            </p>
          ) : (
            <div className="space-y-4">
              {giftCard.appliedToOrders.map((usage) => (
                <Card key={usage.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <LucideCalendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(usage.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Commande:</span>
                          <Link
                            href={`/dashboard/reservations?order=${usage.order.id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {usage.order.orderNumber}
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {usage.order.status}
                          </Badge>
                        </div>
                        {usage.order.client && (
                          <div className="flex items-center gap-2">
                            <LucideUser className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Client:</span>
                            <Link
                              href={`/dashboard/clients/${usage.order.client.id}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {usage.order.client.firstName} {usage.order.client.lastName}
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          -{usage.usedAmount.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}