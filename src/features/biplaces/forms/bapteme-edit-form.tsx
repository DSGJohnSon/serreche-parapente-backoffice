"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useGetMoniteursAndAdmins } from "@/features/users/api/use-get-moniteurs-and-admins";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateBapteme } from "@/features/biplaces/api/use-update-bapteme";

interface BaptemeData {
  id: string;
  date: Date;
  duration: number;
  places: number;
  moniteurId: string;
  price: number;
  monitor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  bookings?: any[];
}

interface BaptemeEditFormProps {
  bapteme: BaptemeData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BaptemeEditForm({
  bapteme,
  onSuccess,
  onCancel,
}: BaptemeEditFormProps) {
  const { data: moniteurs, isLoading: isLoadingMoniteurs } =
    useGetMoniteursAndAdmins();
  const updateBapteme = useUpdateBapteme();

  const [formData, setFormData] = useState({
    date: new Date(),
    time: "10:00",
    duration: 120,
    places: 6,
    moniteurId: "",
    price: 100.0,
  });

  useEffect(() => {
    if (bapteme) {
      const baptemeDate = new Date(bapteme.date);
      const timeString = `${baptemeDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${baptemeDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      setFormData({
        date: baptemeDate,
        time: timeString,
        duration: bapteme.duration,
        places: bapteme.places,
        moniteurId: bapteme.moniteurId,
        price: bapteme.price,
      });
    }
  }, [bapteme]);

  // Calculer le nombre minimum de places (nombre de réservations existantes)
  const minPlaces = bapteme?.bookings?.length || 0;
  const isLoading = updateBapteme.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bapteme || !formData.moniteurId) {
      return;
    }

    // Vérifier que le nombre de places n'est pas inférieur au nombre de réservations
    if (formData.places < minPlaces) {
      alert(`Impossible de réduire le nombre de places à ${formData.places}. Il y a déjà ${minPlaces} réservation(s) pour ce baptême.`);
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const baptemeDate = new Date(formData.date);
    baptemeDate.setHours(hours, minutes, 0, 0);

    const originalDate = new Date(bapteme.date);

    try {
      await updateBapteme.mutateAsync({
        originalDate: originalDate.toISOString(),
        date: baptemeDate.toISOString(),
        duration: formData.duration,
        places: formData.places,
        moniteurId: formData.moniteurId,
        price: formData.price,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal bg-transparent opacity-50 cursor-not-allowed"
          disabled
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(formData.date, "EEEE d MMMM yyyy", { locale: fr })}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Heure</Label>
        <Input
          id="time"
          type="time"
          value={formData.time}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, time: e.target.value }))
          }
          disabled
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Durée (minutes)</Label>
        <Select
          value={formData.duration.toString()}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              duration: Number.parseInt(value),
            }))
          }
          disabled
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="60">1 heure (60 min)</SelectItem>
            <SelectItem value="90">1h30 (90 min)</SelectItem>
            <SelectItem value="120">2 heures (120 min)</SelectItem>
            <SelectItem value="150">2h30 (150 min)</SelectItem>
            <SelectItem value="180">3 heures (180 min)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="places">Nombre de places</Label>
        <Input
          id="places"
          type="number"
          min={minPlaces}
          max="20"
          value={formData.places}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              places: Number.parseInt(e.target.value) || minPlaces,
            }))
          }
          disabled={isLoading}
          required
        />
        {minPlaces > 0 && (
          <p className="text-xs text-muted-foreground">
            Minimum {minPlaces} place(s) (réservations existantes)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Prix (€)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              price: Number.parseFloat(e.target.value) || 0,
            }))
          }
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="moniteur">Moniteur</Label>
        <Select
          value={formData.moniteurId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, moniteurId: value }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un moniteur" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingMoniteurs ? (
              <SelectItem value="" disabled>
                Chargement des moniteurs...
              </SelectItem>
            ) : moniteurs && moniteurs.length > 0 ? (
              moniteurs.map((moniteur) => (
                <SelectItem key={moniteur.id} value={moniteur.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={moniteur.avatarUrl}
                        alt={moniteur.name}
                      />
                      <AvatarFallback className="text-xs">
                        {moniteur.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{moniteur.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({moniteur.role === "ADMIN" ? "Admin" : "Moniteur"})
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                Aucun moniteur disponible
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateBapteme.isPending}
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={updateBapteme.isPending} className="flex-1">
          {updateBapteme.isPending ? "Modification..." : "Modifier"}
        </Button>
      </div>
    </form>
  );
}