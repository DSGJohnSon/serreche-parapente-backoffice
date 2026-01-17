"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useCreateGiftCard } from "@/features/giftcards/api/use-create-giftcard";
// Switched from useGetAllCustomers (Stagiaires) to useGetAllClients (Clients)
import { useGetAllClients } from "@/features/clients/api/use-get-clients";
import { LucideCalendar, LucideRefreshCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface GiftCardAddFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type ExpirationType = "duration" | "date";

const DURATION_PRESETS = [
  { label: "1 mois", value: 1 },
  { label: "2 mois", value: 2 },
  { label: "3 mois", value: 3 },
  { label: "6 mois", value: 6 },
  { label: "1 an", value: 12 },
  { label: "2 ans", value: 24 },
  { label: "3 ans", value: 36 },
  { label: "5 ans", value: 60 },
  { label: "10 ans", value: 120 },
];

export function GiftCardAddForm({ onSuccess, onCancel }: GiftCardAddFormProps) {
  // Use Clients hook instead of Customers hook
  const { data: clients, isLoading: isLoadingClients } = useGetAllClients({
    nopaging: true,
  });
  const createGiftCard = useCreateGiftCard();

  const [formData, setFormData] = useState({
    code: "",
    amount: 0,
    customerId: "",
  });

  // Expiration state
  const [expirationType, setExpirationType] =
    useState<ExpirationType>("duration");
  const [durationMonths, setDurationMonths] = useState(12); // Default 1 year
  const [customExpiryDate, setCustomExpiryDate] = useState<Date | undefined>(
    undefined,
  );

  const isLoading = createGiftCard.isPending;

  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    setFormData((prev) => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.amount <= 0) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    let expiryDate: Date;

    if (expirationType === "duration") {
      const date = new Date();
      date.setMonth(date.getMonth() + durationMonths);
      expiryDate = date;
    } else {
      if (!customExpiryDate) {
        alert("Veuillez sélectionner une date d'expiration");
        return;
      }
      expiryDate = customExpiryDate;
    }

    try {
      await createGiftCard.mutateAsync({
        code: formData.code,
        amount: formData.amount,
        customerId: formData.customerId || undefined,
        expiryDate: expiryDate,
      });

      // Reset form
      setFormData({
        code: "",
        amount: 0,
        customerId: "",
      });
      setExpirationType("duration");
      setDurationMonths(12);
      setCustomExpiryDate(undefined);

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
    setExpirationType("duration");
    setDurationMonths(12);
    setCustomExpiryDate(undefined);
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
              setFormData((prev) => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
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
          Le code doit être unique. Utilisez le bouton &apos;Générer&apos; pour
          créer un code automatiquement.
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

      <div className="space-y-3 pt-2">
        <Label>Expiration</Label>
        <RadioGroup
          value={expirationType}
          onValueChange={(value: string) =>
            setExpirationType(value as ExpirationType)
          }
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="duration" id="duration" />
            <Label htmlFor="duration" className="font-normal cursor-pointer">
              Durée validité
            </Label>
            {expirationType === "duration" && (
              <Select
                value={durationMonths.toString()}
                onValueChange={(val) => setDurationMonths(Number.parseInt(val))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px] h-8 ml-2">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={preset.value.toString()}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="date" id="date" />
            <Label htmlFor="date" className="font-normal cursor-pointer">
              Date personnalisée
            </Label>
            {expirationType === "date" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] h-8 ml-2 pl-3 text-left font-normal",
                      !customExpiryDate && "text-muted-foreground",
                    )}
                    disabled={isLoading}
                  >
                    {customExpiryDate ? (
                      format(customExpiryDate, "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                    <LucideCalendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customExpiryDate}
                    onSelect={setCustomExpiryDate}
                    initialFocus
                    locale={fr}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerId">Client acheteur (optionnel)</Label>
        <Combobox
          options={
            // Map Clients instead of Customers
            // The hook returns object with 'clients' array when paging is on.
            (clients as any)?.clients?.map((client: any) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName} (${client.email})`,
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
        {isLoadingClients && (
          <p className="text-xs text-muted-foreground">
            Chargement des clients...
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Vous pouvez laisser ce champ vide si le client n&apos;est pas encore
          connu.
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
