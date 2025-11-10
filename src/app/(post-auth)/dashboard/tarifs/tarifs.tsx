"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetTarifs } from "@/features/tarifs/api/use-get-tarifs";
import { useUpdateTarif } from "@/features/tarifs/api/use-update-tarif";
import { BaptemeCategory } from "@prisma/client";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";

const CATEGORY_LABELS: Record<BaptemeCategory, string> = {
  AVENTURE: "Aventure",
  DUREE: "Durée",
  LONGUE_DUREE: "Longue Durée",
  ENFANT: "Enfant",
  HIVER: "Hiver",
};

export function Tarifs() {
  const { data: tarifs, isLoading } = useGetTarifs();
  const updateTarif = useUpdateTarif();
  const [editedPrices, setEditedPrices] = useState<Partial<Record<BaptemeCategory, number>>>({});

  const handlePriceChange = (category: BaptemeCategory, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedPrices((prev) => ({
        ...prev,
        [category]: numValue,
      }));
    }
  };

  const handleSave = async (category: BaptemeCategory) => {
    const price = editedPrices[category];
    if (price !== undefined) {
      await updateTarif.mutateAsync({ category, price });
      setEditedPrices((prev) => {
        const newPrices = { ...prev };
        delete newPrices[category];
        return newPrices;
      });
    }
  };

  const getCurrentPrice = (category: BaptemeCategory) => {
    if (editedPrices[category] !== undefined) {
      return editedPrices[category];
    }
    return tarifs?.find((t) => t.category === category)?.price || 0;
  };

  const hasChanges = (category: BaptemeCategory) => {
    return editedPrices[category] !== undefined;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Tarifs</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les prix de base des baptêmes bi-places par catégorie
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
          const baptemeCategory = category as BaptemeCategory;
          const currentPrice = getCurrentPrice(baptemeCategory);
          const isEdited = hasChanges(baptemeCategory);

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>
                  Prix de base pour les baptêmes {label.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`price-${category}`}>Prix (€)</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`price-${category}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => handlePriceChange(baptemeCategory, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSave(baptemeCategory)}
                      disabled={!isEdited || updateTarif.isPending}
                      size="icon"
                    >
                      {updateTarif.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {isEdited && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Modifications non enregistrées
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les prix définis ici sont les prix de base des baptêmes bi-places. Ces prix seront
            automatiquement affichés lors de la création de nouveaux créneaux de baptêmes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}