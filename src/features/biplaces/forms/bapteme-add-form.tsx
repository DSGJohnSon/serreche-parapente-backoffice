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
import { BaptemeCategory } from "@/features/biplaces/schemas";
import { MultiSelect } from "@/components/ui/multi-select";

interface BaptemeData {
  date: Date;
  duration: number;
  places: number;
  moniteurIds: string[];
  categories: BaptemeCategory[];
}

interface BaptemeAddFormProps {
  selectedDate?: Date | null;
  selectedHour?: number;
  onSubmit: (bapteme: BaptemeData) => void;
  onCancel?: () => void;
}

// Labels pour les catégories
const CATEGORY_LABELS: Record<BaptemeCategory, string> = {
  [BaptemeCategory.AVENTURE]: "Aventure",
  [BaptemeCategory.DUREE]: "Durée",
  [BaptemeCategory.LONGUE_DUREE]: "Longue Durée",
  [BaptemeCategory.ENFANT]: "Enfant",
  [BaptemeCategory.HIVER]: "Hiver"
};

// Prix pour chaque catégorie
const CATEGORY_PRICES: Record<BaptemeCategory, number> = {
  [BaptemeCategory.AVENTURE]: 110,
  [BaptemeCategory.DUREE]: 150,
  [BaptemeCategory.LONGUE_DUREE]: 185,
  [BaptemeCategory.ENFANT]: 90,
  [BaptemeCategory.HIVER]: 130
};

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
    moniteurIds: [] as string[],
    categories: [] as BaptemeCategory[],
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

    console.log('Form data at submit:', formData);

    if (!formData.moniteurIds || formData.moniteurIds.length === 0) {
      alert("Veuillez sélectionner au moins un moniteur");
      return;
    }

    if (formData.categories.length === 0) {
      alert("Veuillez sélectionner au moins une catégorie");
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const baptemeDate = new Date(formData.date);
    baptemeDate.setHours(hours, minutes, 0, 0);

    const newBapteme = {
      date: baptemeDate,
      duration: formData.duration,
      places: formData.places,
      moniteurIds: formData.moniteurIds,
      categories: formData.categories,
    };

    console.log('Submitting bapteme:', newBapteme);
    onSubmit(newBapteme);

    // Reset form
    setFormData({
      date: new Date(),
      time: "10:00",
      duration: 120,
      places: 6,
      moniteurIds: [],
      categories: [],
    });
    setIsCustomDuration(false);
    setCustomDuration("");
  };

  const handleCategoryChange = (category: BaptemeCategory, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter((c) => c !== category),
    }));
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

      <div className="space-y-3">
        <Label>Catégories de baptêmes disponibles</Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(BaptemeCategory).map((category) => (
            <div
              key={category}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleCategoryChange(category, !formData.categories.includes(category))}
            >
              <input
                type="checkbox"
                id={category}
                checked={formData.categories.includes(category)}
                onChange={() => {}} // Handled by div onClick
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded pointer-events-none"
              />
              <div className="flex-1">
                <Label
                  htmlFor={category}
                  className="text-sm font-medium cursor-pointer"
                >
                  {CATEGORY_LABELS[category]}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Prix: {CATEGORY_PRICES[category]}€
                </p>
              </div>
            </div>
          ))}
        </div>
        {formData.categories.length === 0 && (
          <p className="text-xs text-red-500">
            Veuillez sélectionner au moins une catégorie
          </p>
        )}
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
            onValueChange={(values) => {
              console.log('MultiSelect values changed:', values);
              setFormData((prev) => ({ ...prev, moniteurIds: values }));
            }}
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
          Créer le Baptême
        </Button>
      </div>
    </form>
  );
}