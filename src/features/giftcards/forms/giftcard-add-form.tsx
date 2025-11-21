"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useCreateGiftCard } from "@/features/giftcards/api/use-create-giftcard";
import { useGetAllCustomers } from "@/features/customers/api/use-get-customers";
import { LucideRefreshCw } from "lucide-react";

interface GiftCardAddFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GiftCardAddForm({
  onSuccess,
  onCancel,
}: GiftCardAddFormProps) {
  const { data: customers, isLoading: isLoadingCustomers } = useGetAllCustomers();
  const createGiftCard = useCreateGiftCard();

  const [formData, setFormData] = useState({
    code: "",
    amount: 0,
    customerId: "",
  });

  const isLoading = createGiftCard.isPending;

  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData((prev) => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.amount <= 0) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createGiftCard.mutateAsync({
        code: formData.code,
        amount: formData.amount,
        customerId: formData.customerId || undefined,
      });

      // Reset form
      setFormData({
        code: "",
        amount: 0,
        customerId: "",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      amount: 0,
      customerId: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code de la carte cadeau *</Label>
        <div className="flex gap-2">
          <Input
            id="code"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
            }
            placeholder="Ex: ABC12345"
            disabled={isLoading}
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={generateCode}
            disabled={isLoading}
            className="px-3"
          >
            <LucideRefreshCw className="h-4 w-4" />
            Générer
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le code doit être unique. Utilisez le bouton &apos;Générer&apos; pour créer un code automatiquement.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€) *</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.amount || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              amount: Number.parseFloat(e.target.value) || 0,
            }))
          }
          placeholder="Ex: 50.00"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerId">Client acheteur (optionnel)</Label>
        <Combobox
          options={
            customers?.map((customer) => ({
              value: customer.id,
              label: `${customer.firstName} ${customer.lastName} (${customer.email})`,
            })) || []
          }
          value={formData.customerId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, customerId: value }))
          }
          placeholder="Sélectionner un client (optionnel)"
          emptyText="Aucun client trouvé"
          searchPlaceholder="Rechercher un client..."
          disabled={isLoading}
        />
        {isLoadingCustomers && (
          <p className="text-xs text-muted-foreground">
            Chargement des clients...
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Vous pouvez laisser ce champ vide si le client n&apos;est pas encore connu.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            disabled={isLoading}
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Création..." : "Créer la carte cadeau"}
        </Button>
      </div>
    </form>
  );
}