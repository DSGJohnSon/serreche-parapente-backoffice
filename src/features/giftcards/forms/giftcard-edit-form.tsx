"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { useUpdateGiftCard } from "@/features/giftcards/api/use-update-giftcard";
import { useGetAllCustomers } from "@/features/customers/api/use-get-customers";

interface GiftCardData {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  customerId: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  createdAt: Date;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  usedByCustomer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface GiftCardEditFormProps {
  giftCard: GiftCardData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GiftCardEditForm({
  giftCard,
  onSuccess,
  onCancel,
}: GiftCardEditFormProps) {
  const { data: customers, isLoading: isLoadingCustomers } = useGetAllCustomers();
  const updateGiftCard = useUpdateGiftCard();

  const [formData, setFormData] = useState({
    amount: 0,
    isUsed: false,
    usedBy: "",
  });

  useEffect(() => {
    if (giftCard) {
      setFormData({
        amount: giftCard.amount,
        isUsed: giftCard.isUsed,
        usedBy: giftCard.usedBy || "",
      });
    }
  }, [giftCard]);

  const isLoading = updateGiftCard.isPending;
  const isUsedCard = giftCard?.isUsed || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!giftCard) {
      return;
    }

    try {
      const updateData: any = {
        id: giftCard.id,
        amount: formData.amount,
      };

      // Si on marque comme utilisé et qu'il n'était pas utilisé avant
      if (formData.isUsed && !giftCard.isUsed) {
        if (!formData.usedBy) {
          alert("Veuillez sélectionner un client qui a utilisé la carte cadeau");
          return;
        }
        updateData.isUsed = true;
        updateData.usedBy = formData.usedBy;
        updateData.usedAt = new Date();
      }
      // Si on marque comme non utilisé et qu'il était utilisé avant
      else if (!formData.isUsed && giftCard.isUsed) {
        updateData.isUsed = false;
        updateData.usedBy = null;
        updateData.usedAt = null;
      }
      // Si on change juste l'utilisateur (reste utilisé)
      else if (formData.isUsed && giftCard.isUsed && formData.usedBy !== giftCard.usedBy) {
        if (!formData.usedBy) {
          alert("Veuillez sélectionner un client qui a utilisé la carte cadeau");
          return;
        }
        updateData.usedBy = formData.usedBy;
      }

      await updateGiftCard.mutateAsync(updateData);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={giftCard.code}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Le code ne peut pas être modifié
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€)</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.amount}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              amount: Number.parseFloat(e.target.value) || 0,
            }))
          }
          disabled={isLoading || isUsedCard}
          required
        />
        {isUsedCard && (
          <p className="text-xs text-muted-foreground">
            Le montant ne peut pas être modifié pour une carte cadeau utilisée
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="isUsed"
            checked={formData.isUsed}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                isUsed: checked,
                usedBy: checked ? prev.usedBy : "",
              }))
            }
            disabled={isLoading}
          />
          <Label htmlFor="isUsed">Carte cadeau utilisée</Label>
        </div>
      </div>

      {formData.isUsed && (
        <div className="space-y-2">
          <Label htmlFor="usedBy">Utilisé par</Label>
          <Combobox
            options={
              customers?.map((customer) => ({
                value: customer.id,
                label: `${customer.firstName} ${customer.lastName} (${customer.email})`,
              })) || []
            }
            value={formData.usedBy}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, usedBy: value }))
            }
            placeholder="Sélectionner un client"
            emptyText="Aucun client trouvé"
            searchPlaceholder="Rechercher un client..."
            disabled={isLoading}
          />
          {isLoadingCustomers && (
            <p className="text-xs text-muted-foreground">
              Chargement des clients...
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Modification..." : "Modifier"}
        </Button>
      </div>
    </form>
  );
}