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
import { StageType } from "@prisma/client";
import { useGetMoniteursAndAdmins } from "@/features/users/api/use-get-moniteurs-and-admins";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelect } from "@/components/ui/multi-select";

interface StageAddFormProps {
  selectedDate?: Date | null;
  onSubmit: (stage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurIds: string[];
    price: number;
    type: StageType;
  }) => void;
  onCancel?: () => void;
}

export function StageAddForm({
  selectedDate,
  onSubmit,
  onCancel,
}: StageAddFormProps) {
  const { data: moniteurs, isLoading: isLoadingMoniteurs } = useGetMoniteursAndAdmins();
  
  const [formData, setFormData] = useState({
    startDate: selectedDate || new Date(),
    duration: 7,
    places: 6,
    moniteurIds: [] as string[],
    price: 350.0,
    type: StageType.INITIATION as StageType,
  });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, startDate: selectedDate }));
    }
  }, [selectedDate]);

  // Durées par défaut selon le type de stage
  const getDefaultDuration = (type: StageType): number => {
    switch (type) {
      case StageType.AUTONOMIE:
        return 14; // 2 semaines
      case StageType.INITIATION:
      case StageType.PROGRESSION:
      case StageType.DOUBLE:
      default:
        return 7; // 1 semaine
    }
  };

  // Prix par défaut selon le type de stage
  const getDefaultPrice = (type: StageType): number => {
    switch (type) {
      case StageType.AUTONOMIE:
        return 500.0; // Prix plus élevé pour 2 semaines
      case StageType.INITIATION:
      case StageType.PROGRESSION:
      case StageType.DOUBLE:
      default:
        return 350.0; // Prix standard pour 1 semaine
    }
  };

  // Mettre à jour la durée et le prix quand le type change
  const handleTypeChange = (type: StageType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      duration: getDefaultDuration(type),
      price: getDefaultPrice(type),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.moniteurIds.length === 0) {
      alert("Veuillez sélectionner au moins un moniteur");
      return;
    }

    onSubmit({
      startDate: formData.startDate,
      duration: formData.duration,
      places: formData.places,
      moniteurIds: formData.moniteurIds,
      price: formData.price,
      type: formData.type,
    });

    // Reset form
    setFormData({
      startDate: new Date(),
      duration: 7,
      places: 6,
      moniteurIds: [],
      price: 350.0,
      type: StageType.INITIATION,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, startDate: date }));
      setShowCalendar(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startDate">Date de début</Label>
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-transparent"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(formData.startDate, "EEEE d MMMM yyyy", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[60]" align="start">
            <Calendar
              mode="single"
              selected={formData.startDate}
              onSelect={handleDateSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type de stage</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleTypeChange(value as StageType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={StageType.INITIATION}>Initiation (7 jours)</SelectItem>
            <SelectItem value={StageType.PROGRESSION}>Progression (7 jours)</SelectItem>
            <SelectItem value={StageType.AUTONOMIE}>Autonomie (14 jours)</SelectItem>
            <SelectItem value={StageType.DOUBLE}>Double - Initiation/Progression (7 jours)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Durée (jours)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          max="30"
          value={formData.duration}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              duration: Number.parseInt(e.target.value) || 1,
            }))
          }
          required
        />
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
        <Label htmlFor="moniteurs">Moniteurs</Label>
        {isLoadingMoniteurs ? (
          <div className="text-sm text-muted-foreground">
            Chargement des moniteurs...
          </div>
        ) : moniteurs && moniteurs.length > 0 ? (
          <MultiSelect
            options={moniteurs.map((moniteur) => ({
              value: moniteur.id,
              label: `${moniteur.name} (${moniteur.role === 'ADMIN' ? 'Admin' : 'Moniteur'})`,
            }))}
            onValueChange={(values) =>
              setFormData((prev) => ({ ...prev, moniteurIds: values }))
            }
            defaultValue={formData.moniteurIds}
            placeholder="Sélectionner des moniteurs"
            variant="inverted"
            maxCount={3}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Aucun moniteur disponible
          </div>
        )}
        {formData.moniteurIds.length === 0 && (
          <p className="text-xs text-red-500">
            Veuillez sélectionner au moins un moniteur
          </p>
        )}
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
          Créer le Stage
        </Button>
      </div>
    </form>
  );
}