"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Stage, User, StageBooking, Customer } from "@prisma/client";

interface StageWithDetails extends Stage {
  moniteur: User;
  bookings: (StageBooking & { customer: Customer })[];
}

interface StageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: StageWithDetails | null;
}

export function StageDetailsDialog({
  open,
  onOpenChange,
  stage,
}: StageDetailsDialogProps) {
  if (!stage) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INITIATION":
        return "bg-blue-100 text-blue-800";
      case "PROGRESSION":
        return "bg-green-100 text-green-800";
      case "AUTONOMIE":
        return "bg-purple-100 text-purple-800";
      case "DOUBLE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INITIATION":
        return "Initiation";
      case "PROGRESSION":
        return "Progression";
      case "AUTONOMIE":
        return "Autonomie";
      case "DOUBLE":
        return "Double";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Stage {getTypeLabel(stage.type)}
            <Badge className={getTypeColor(stage.type)}>
              {getTypeLabel(stage.type)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations du stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Informations générales</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Date de début:</span>{" "}
                  {format(new Date(stage.startDate), "EEEE d MMMM yyyy", { locale: fr })}
                </div>
                <div>
                  <span className="font-medium">Durée:</span> {stage.duration} jours
                </div>
                <div>
                  <span className="font-medium">Prix:</span> {stage.price}€
                </div>
                <div>
                  <span className="font-medium">Places:</span> {stage.places}
                </div>
                <div>
                  <span className="font-medium">Places restantes:</span>{" "}
                  {stage.places - stage.bookings.length}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Moniteur</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={stage.moniteur.avatarUrl} alt={stage.moniteur.name} />
                  <AvatarFallback className="text-xs">
                    {stage.moniteur.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{stage.moniteur.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {stage.moniteur.role === 'ADMIN' ? 'Administrateur' : 'Moniteur'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Réservations */}
          <div>
            <h3 className="font-semibold mb-2">
              Réservations ({stage.bookings.length}/{stage.places})
            </h3>
            {stage.bookings.length > 0 ? (
              <div className="space-y-2">
                {stage.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.customer.email}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {booking.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Aucune réservation pour ce stage
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}