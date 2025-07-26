"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bapteme, User } from "@prisma/client";
import { CalendarIcon, ClockIcon, UsersIcon, EuroIcon, MailIcon, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditBaptemeDialog } from "./edit-bapteme-dialog";
import { useDeleteBapteme } from "@/features/biplaces/api/use-delete-bapteme";

interface BaptemeWithMoniteur extends Bapteme {
  moniteur: User;
  bookings?: any[];
}

interface BaptemeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bapteme: BaptemeWithMoniteur | null;
}

export function BaptemeDetailsDialog({
  open,
  onOpenChange,
  bapteme,
}: BaptemeDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const deleteBapteme = useDeleteBapteme();

  if (!bapteme) return null;

  const hasBookings = bapteme.bookings && bapteme.bookings.length > 0;

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (hasBookings) {
      alert("Ce baptême ne peut pas être supprimé car il contient des réservations.");
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer ce baptême ?")) {
      try {
        await deleteBapteme.mutateAsync({
          date: bapteme.date.toISOString(),
        });
        onOpenChange(false);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const endTime = new Date(bapteme.date);
  endTime.setMinutes(endTime.getMinutes() + bapteme.duration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du Baptême</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(bapteme.date, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(bapteme.date, "HH:mm", { locale: fr })} - {format(endTime, "HH:mm", { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Durée</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(bapteme.duration)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Places disponibles</p>
                <p className="text-sm text-muted-foreground">
                  {bapteme.places} personnes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EuroIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Prix</p>
                <p className="text-sm text-muted-foreground">
                  {bapteme.price.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Informations du moniteur */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Moniteur assigné</h3>
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={bapteme.moniteur.avatarUrl} alt={bapteme.moniteur.name} />
                <AvatarFallback>
                  {bapteme.moniteur.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{bapteme.moniteur.name}</p>
                  <Badge variant={bapteme.moniteur.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {bapteme.moniteur.role === 'ADMIN' ? 'Admin' : 'Moniteur'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MailIcon className="h-4 w-4" />
                  <span>{bapteme.moniteur.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Membre depuis {format(bapteme.moniteur.createdAt, "MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={hasBookings || deleteBapteme.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteBapteme.isPending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <EditBaptemeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        bapteme={bapteme}
      />
    </Dialog>
  );
}