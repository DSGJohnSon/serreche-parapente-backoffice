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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bapteme } from "@prisma/client";
import { useGetMoniteursAndAdmins } from "@/features/users/api/use-get-moniteurs-and-admins";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BaptemeAddFormProps {
  selectedDate?: Date | null;
  selectedHour?: number;
  onSubmit: (bapteme: Omit<Bapteme, "id">) => void;
  onCancel?: () => void;
}

export function BaptemeAddForm({
  selectedDate,
  selectedHour,
  onSubmit,
  onCancel,
}: BaptemeAddFormProps) {
  const { data: moniteurs, isLoading: isLoadingMoniteurs } = useGetMoniteursAndAdmins();
  
  const [formData, setFormData] = useState({
    date: selectedDate || new Date(),
    time: "10:00",
    duration: 120,
    places: 6,
    moniteurId: "",
    price: 100.0,
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState("");

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedHour !== undefined) {
      const timeString = `${selectedHour.toString().padStart(2, "0")}:00`;
      setFormData((prev) => ({ ...prev, time: timeString }));
    }
  }, [selectedHour]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.moniteurId) {
      alert("Veuillez sélectionner un moniteur");
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const baptemeDate = new Date(formData.date);
    baptemeDate.setHours(hours, minutes, 0, 0);

    const selectedMoniteur = moniteurs?.find(
      (m) => m.id === formData.moniteurId
    );

    if (!selectedMoniteur) {
      alert("Moniteur non trouvé");
      return;
    }

    const newBapteme: Omit<Bapteme, "id"> = {
      date: baptemeDate,
      duration: formData.duration,
      places: formData.places,
      moniteurId: formData.moniteurId,
      price: formData.price,
    };

    onSubmit(newBapteme);

    // Reset form
    setFormData({
      date: new Date(),
      time: "10:00",
      duration: 120,
      places: 6,
      moniteurId: "",
      price: 100.0,
    });
    setIsCustomDuration(false);
    setCustomDuration("");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
      setShowCalendar(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-transparent"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(formData.date, "EEEE d MMMM yyyy", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={handleDateSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
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
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Durée (minutes)</Label>
        <Select
          value={isCustomDuration ? "custom" : formData.duration.toString()}
          onValueChange={(value) => {
            if (value === "custom") {
              setIsCustomDuration(true);
              setCustomDuration(formData.duration.toString());
            } else {
              setIsCustomDuration(false);
              setFormData((prev) => ({
                ...prev,
                duration: Number.parseInt(value),
              }));
            }
          }}
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
            <SelectItem value="custom">Durée personnalisée</SelectItem>
          </SelectContent>
        </Select>
        
        {isCustomDuration && (
          <div className="mt-2">
            <Input
              type="number"
              min="1"
              max="600"
              placeholder="Durée en minutes"
              value={customDuration}
              onChange={(e) => {
                const value = e.target.value;
                setCustomDuration(value);
                if (value && !isNaN(Number(value))) {
                  setFormData((prev) => ({
                    ...prev,
                    duration: Number.parseInt(value),
                  }));
                }
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Entrez la durée souhaitée en minutes (1-600)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="places">Nombre de places</Label>
        <Input
          id="places"
          type="number"
          min="1"
          max="20"
          value={formData.places}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              places: Number.parseInt(e.target.value) || 1,
            }))
          }
          required
        />
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
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un moniteur" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingMoniteurs ? (
              <SelectItem value="loading" disabled>
                Chargement des moniteurs...
              </SelectItem>
            ) : moniteurs && moniteurs.length > 0 ? (
              moniteurs.map((moniteur) => (
                <SelectItem key={moniteur.id} value={moniteur.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={moniteur.avatarUrl} alt={moniteur.name} />
                      <AvatarFallback className="text-xs">
                        {moniteur.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{moniteur.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({moniteur.role === 'ADMIN' ? 'Admin' : 'Moniteur'})
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
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
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1">
          Créer le Baptême
        </Button>
      </div>
    </form>
  );
}