"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface AddBaptemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onCreateBapteme: (bapteme: Omit<Bapteme, "id">) => void;
}

// Mock moniteurs data - replace with your actual data source
const mockMoniteurs = [
  { id: "user1", name: "Jean Dupont", email: "jean.dupont@example.com" },
  { id: "user2", name: "Marie Martin", email: "marie.martin@example.com" },
  { id: "user3", name: "Pierre Durand", email: "pierre.durand@example.com" },
];

export function AddBaptemeDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateBapteme,
}: AddBaptemeDialogProps) {
  const [formData, setFormData] = useState({
    date: selectedDate || new Date(),
    time: "10:00",
    duration: 120,
    places: 6,
    moniteurId: "",
    price: 100.0,
  });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.moniteurId) {
      alert("Veuillez sélectionner un moniteur");
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const baptemeDate = new Date(formData.date);
    baptemeDate.setHours(hours, minutes, 0, 0);

    const selectedMoniteur = mockMoniteurs.find(
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

    onCreateBapteme(newBapteme);

    // Reset form
    setFormData({
      date: new Date(),
      time: "10:00",
      duration: 120,
      places: 6,
      moniteurId: "",
      price: 100.0,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
      setShowCalendar(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau Baptême</DialogTitle>
        </DialogHeader>

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
                  initialFocus
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
              value={formData.duration.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  duration: Number.parseInt(value),
                }))
              }
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
                {mockMoniteurs.map((moniteur) => (
                  <SelectItem key={moniteur.id} value={moniteur.id}>
                    {moniteur.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">Créer le Baptême</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
