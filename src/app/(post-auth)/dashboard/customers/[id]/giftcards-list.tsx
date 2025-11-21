"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideGift, LucideEye, LucideEyeOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  usedByCustomer?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface GiftCardsListProps {
  purchasedGiftCards: GiftCard[];
  usedGiftCards: GiftCard[];
}

export function GiftCardsList({ purchasedGiftCards, usedGiftCards }: GiftCardsListProps) {
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

  const toggleCodeVisibility = (cardId: string) => {
    const newVisibleCodes = new Set(visibleCodes);
    if (newVisibleCodes.has(cardId)) {
      newVisibleCodes.delete(cardId);
    } else {
      newVisibleCodes.add(cardId);
    }
    setVisibleCodes(newVisibleCodes);
  };

  const formatCode = (code: string, isVisible: boolean) => {
    if (isVisible) return code;
    return code.replace(/./g, "•");
  };

  // Ne pas afficher les sections si aucune carte cadeau n'existe
  if (purchasedGiftCards.length === 0 && usedGiftCards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Cartes Cadeaux Achetées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideGift className="h-5 w-5" />
            Cartes Cadeaux Achetées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchasedGiftCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune carte cadeau achetée
            </p>
          ) : (
            <div className="space-y-3">
              {purchasedGiftCards.map((giftCard) => (
                <div
                  key={giftCard.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={giftCard.isUsed ? "destructive" : "secondary"}>
                      {giftCard.isUsed ? "Utilisé" : "Disponible"}
                    </Badge>
                    <span className="font-bold text-green-600">
                      {giftCard.amount.toFixed(2)}€
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Code:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {formatCode(giftCard.code, visibleCodes.has(giftCard.id))}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCodeVisibility(giftCard.id)}
                    >
                      {visibleCodes.has(giftCard.id) ? (
                        <LucideEyeOff className="h-3 w-3" />
                      ) : (
                        <LucideEye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Acheté le {format(new Date(giftCard.createdAt), "dd/MM/yyyy", { locale: fr })}
                    {giftCard.isUsed && giftCard.usedAt && (
                      <span className="block">
                        Utilisé le {format(new Date(giftCard.usedAt), "dd/MM/yyyy", { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cartes Cadeaux Utilisées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideGift className="h-5 w-5" />
            Cartes Cadeaux Utilisées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedGiftCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas de cartes cadeaux utilisées
            </p>
          ) : (
            <div className="space-y-3">
              {usedGiftCards.map((giftCard) => (
                <div
                  key={giftCard.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">Utilisé</Badge>
                    <span className="font-bold text-red-600">
                      {giftCard.amount.toFixed(2)}€
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Code:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {formatCode(giftCard.code, visibleCodes.has(giftCard.id))}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCodeVisibility(giftCard.id)}
                    >
                      {visibleCodes.has(giftCard.id) ? (
                        <LucideEyeOff className="h-3 w-3" />
                      ) : (
                        <LucideEye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {giftCard.customer && (
                      <span className="block">
                        Acheté par {giftCard.customer.firstName} {giftCard.customer.lastName}
                      </span>
                    )}
                    {giftCard.usedAt && (
                      <span className="block">
                        Utilisé le {format(new Date(giftCard.usedAt), "dd/MM/yyyy", { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}