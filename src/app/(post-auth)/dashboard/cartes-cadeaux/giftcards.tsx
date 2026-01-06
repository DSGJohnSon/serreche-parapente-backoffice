"use client";

import { useState } from "react";
import {
  LucideFrown,
  LucideRefreshCcw,
  LucideGift,
  LucideEye,
  LucideEyeOff,
  LucideEdit,
  LucideTrash2,
  LucideUser,
  LucidePlus,
  LucideExternalLink,
} from "lucide-react";
import { EditGiftCardDialog } from "./edit-giftcard-dialog";
import { AddGiftCardDialog } from "./add-giftcard-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useRouter } from "next/navigation";
import {
  useGetUnusedGiftCards,
  useGetUsedGiftCards,
} from "@/features/giftcards/api/use-get-giftcards";
import { useDeleteGiftCard } from "@/features/giftcards/api/use-delete-giftcard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export function GiftCards() {
  const [showUsedCards, setShowUsedCards] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [editingGiftCard, setEditingGiftCard] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: unusedGiftCards, isLoading: isLoadingUnused } =
    useGetUnusedGiftCards();
  const {
    data: usedGiftCards,
    isLoading: isLoadingUsed,
    refetch: refetchUsed,
  } = useGetUsedGiftCards();
  const deleteGiftCard = useDeleteGiftCard();

  const router = useRouter();

  const toggleCodeVisibility = (cardId: string) => {
    const newVisibleCodes = new Set(visibleCodes);
    if (newVisibleCodes.has(cardId)) {
      newVisibleCodes.delete(cardId);
    } else {
      newVisibleCodes.add(cardId);
    }
    setVisibleCodes(newVisibleCodes);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte cadeau ?")) {
      await deleteGiftCard.mutateAsync({ id });
    }
  };

  const handleEdit = (giftCard: any) => {
    setEditingGiftCard(giftCard);
    setShowEditDialog(true);
  };

  const formatCode = (code: string, isVisible: boolean) => {
    if (isVisible) return code;
    return code.replace(/./g, "•");
  };

  if (isLoadingUnused) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex gap-4 mb-6">
          <Skeleton className="w-full h-36" />
          <Skeleton className="w-full h-36" />
        </div>
        <div className="w-full h-full">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (!unusedGiftCards) {
    return (
      <div className="bg-slate-200 text-slate-800 rounded-md p-8 flex flex-col items-center justify-center border border-slate-400 gap-4">
        <LucideFrown />
        <div className="flex flex-col items-center">
          <p>Aucune carte cadeau n&apos;a été trouvée.</p>
          <p className="text-xs">
            Ceci peut être dû à une erreur de connexion avec la base de données.
          </p>
          <Button
            variant={"secondary"}
            size={"lg"}
            className="mt-4"
            onClick={() => {
              router.refresh();
            }}
          >
            <LucideRefreshCcw />
            Rafraîchir la page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Cartes Cadeaux
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez les cartes cadeaux de votre établissement
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="w-full sm:w-auto"
        >
          <LucidePlus className="h-4 w-4 mr-2" />
          Ajouter une carte cadeau
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cartes non utilisées
            </CardTitle>
            <LucideGift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {unusedGiftCards.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur totale:{" "}
              {unusedGiftCards
                .reduce((sum, card) => sum + card.amount, 0)
                .toFixed(2)}
              €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cartes utilisées
            </CardTitle>
            <LucideGift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {usedGiftCards?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur totale:{" "}
              {(
                usedGiftCards?.reduce((sum, card) => sum + card.amount, 0) || 0
              ).toFixed(2)}
              €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unused Gift Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cartes Cadeaux Non Utilisées</CardTitle>
          <CardDescription>
            Liste des cartes cadeaux disponibles à l&apos;utilisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unusedGiftCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune carte cadeau non utilisée
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unusedGiftCards.map((giftCard) => {
                const remainingAmount =
                  giftCard.remainingAmount || giftCard.amount;
                return (
                  <Card
                    key={giftCard.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Non utilisé</Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {remainingAmount.toFixed(2)}€
                            </div>
                            {remainingAmount < giftCard.amount && (
                              <div className="text-xs text-muted-foreground">
                                sur {giftCard.amount.toFixed(2)}€
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Code:</span>
                            <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                              {formatCode(
                                giftCard.code,
                                visibleCodes.has(giftCard.id)
                              )}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCodeVisibility(giftCard.id)}
                            >
                              {visibleCodes.has(giftCard.id) ? (
                                <LucideEyeOff className="h-4 w-4" />
                              ) : (
                                <LucideEye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Créé le{" "}
                            {format(
                              new Date(giftCard.createdAt),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )}
                          </div>

                          {giftCard.client && (
                            <div className="flex items-center gap-1 text-sm">
                              <LucideUser className="h-3 w-3" />
                              <span className="text-xs">Acheté par:</span>
                              <Link
                                href={`/dashboard/customers/${giftCard.client.id}`}
                                className="text-blue-600 hover:underline text-xs truncate"
                              >
                                {giftCard.client.firstName}{" "}
                                {giftCard.client.lastName}
                              </Link>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Link
                            href={`/dashboard/cartes-cadeaux/${giftCard.id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <LucideExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(giftCard)}
                            className="flex-1"
                          >
                            <LucideEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(giftCard.id)}
                            disabled={deleteGiftCard.isPending}
                            className="flex-1"
                          >
                            <LucideTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Used Gift Cards Section (Collapsible) */}
      <Collapsible open={showUsedCards} onOpenChange={setShowUsedCards}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cartes Cadeaux Utilisées</CardTitle>
                  <CardDescription>
                    Historique des cartes cadeaux utilisées
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {showUsedCards ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {isLoadingUsed ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !usedGiftCards || usedGiftCards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune carte cadeau utilisée
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {usedGiftCards.map((giftCard) => {
                    const remainingAmount = giftCard.remainingAmount || 0;
                    return (
                      <Card
                        key={giftCard.id}
                        className="border-l-4 border-l-red-500"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="destructive">Utilisé</Badge>
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600">
                                  {remainingAmount.toFixed(2)}€
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  sur {giftCard.amount.toFixed(2)}€
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Code:
                                </span>
                                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                                  {formatCode(
                                    giftCard.code,
                                    visibleCodes.has(giftCard.id)
                                  )}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleCodeVisibility(giftCard.id)
                                  }
                                >
                                  {visibleCodes.has(giftCard.id) ? (
                                    <LucideEyeOff className="h-4 w-4" />
                                  ) : (
                                    <LucideEye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Utilisé le{" "}
                                {giftCard.usedAt &&
                                  format(
                                    new Date(giftCard.usedAt),
                                    "dd/MM/yyyy",
                                    { locale: fr }
                                  )}
                              </div>

                              <div className="space-y-1">
                                {giftCard.client && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <LucideUser className="h-3 w-3" />
                                    <span>Acheté par:</span>
                                    <Link
                                      href={`/dashboard/customers/${giftCard.client.id}`}
                                      className="text-blue-600 hover:underline truncate"
                                    >
                                      {giftCard.client.firstName}{" "}
                                      {giftCard.client.lastName}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2">
                              <Link
                                href={`/dashboard/cartes-cadeaux/${giftCard.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <LucideExternalLink className="h-4 w-4 mr-2" />
                                  Voir détails
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Edit Dialog */}
      <EditGiftCardDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        giftCard={editingGiftCard}
      />

      {/* Add Dialog */}
      <AddGiftCardDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
