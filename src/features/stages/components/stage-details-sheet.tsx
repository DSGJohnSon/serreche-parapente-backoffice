"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Stage, User, StageBooking } from "@prisma/client";
import { useState } from "react";
import { Plus, Minus, Edit2, Trash2, Save, X } from "lucide-react";
import { useGetMoniteursAndAdmins } from "@/features/users/api/use-get-moniteurs-and-admins";
import { useGetStageById } from "../api/use-get-stage";
import { useUpdateStage } from "../api/use-update-stages";
import { useDeleteStage } from "../api/use-delete-stages";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";

interface StageWithDetails extends Stage {
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: any[];
  acomptePrice: number;
}

interface StageDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: StageWithDetails | null;
  role?: string;
}

export function StageDetailsSheet({
  open,
  onOpenChange,
  stage,
  role,
}: StageDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedStage, setEditedStage] = useState<{
    places: number;
    price: number;
    acomptePrice: number;
    moniteurIds: string[];
  } | null>(null);

  const { data: moniteurs } = useGetMoniteursAndAdmins();
  const { data: fullStageData, isLoading: isLoadingDetails } = useGetStageById(
    stage?.id || "",
  );

  const displayStage = fullStageData || stage;

  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();

  if (!displayStage) return null;

  // Use optional chaining for bookings as it might be undefined in basic stage object
  const bookings = fullStageData?.bookings || [];
  const currentBookingsCount =
    fullStageData?.bookings?.length ??
    (displayStage as any).confirmedBookings ??
    0;

  const placesRestantes = displayStage.places - currentBookingsCount;

  const handleEdit = () => {
    setEditedStage({
      places: displayStage.places,
      price: displayStage.price,
      acomptePrice: displayStage.acomptePrice,
      moniteurIds: displayStage.moniteurs.map((m: any) => m.moniteur.id),
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedStage(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!editedStage) return;

    updateStage.mutate(
      {
        id: displayStage.id,
        startDate: new Date(displayStage.startDate).toISOString(),
        duration: displayStage.duration,
        places: editedStage.places,
        price: editedStage.price,
        acomptePrice: editedStage.acomptePrice,
        moniteurIds: editedStage.moniteurIds,
        type: displayStage.type,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditedStage(null);
          onOpenChange(false);
        },
      },
    );
  };

  const handleIncreasePlaces = () => {
    if (!editedStage) return;
    setEditedStage({
      ...editedStage,
      places: editedStage.places + 1,
    });
  };

  const handleDecreasePlaces = () => {
    if (!editedStage) return;
    if (editedStage.places <= currentBookingsCount) {
      toast.error(
        `Impossible de réduire en dessous de ${currentBookingsCount} places (nombre de réservations actuelles)`,
      );
      return;
    }
    if (editedStage.places <= 1) {
      toast.error("Le nombre de places doit être supérieur à 0");
      return;
    }
    setEditedStage({
      ...editedStage,
      places: editedStage.places - 1,
    });
  };

  const handleDelete = () => {
    if (currentBookingsCount > 0) {
      toast.error("Impossible de supprimer un stage avec des réservations");
      return;
    }

    deleteStage.mutate(
      { id: displayStage.id },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Stage {getTypeLabel(displayStage.type)}
              <Badge className={getTypeColor(displayStage.type)}>
                {getTypeLabel(displayStage.type)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  {role === "ADMIN" && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentBookingsCount > 0}
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateStage.isPending}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informations du stage */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Informations générales</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">
                    Date de début:
                  </span>
                  <span>
                    {format(new Date(displayStage.startDate), "EEEE d MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">
                    Durée:
                  </span>
                  <span>{displayStage.duration} jours</span>
                </div>

                {/* Prix - Editable */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">
                    Prix:
                  </span>
                  {isEditing && editedStage ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedStage.price}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          // recalcul automatique de l'acompte à 2/5 du prix (40%), arrondi à 2 décimales
                          const acompte = Math.round(price * 0.4 * 100) / 100;
                          setEditedStage({
                            ...editedStage,
                            price,
                            acomptePrice: acompte,
                          });
                        }}
                        className="w-20 h-8"
                        min="0"
                        step="0.01"
                      />
                      <span>€</span>
                    </div>
                  ) : (
                    <span className="font-semibold">{displayStage.price}€</span>
                  )}
                </div>

                {/* Prix de l'acompte - Editable */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">
                    Prix de l&apos;acompte (20% du prix total):
                  </span>
                  {isEditing && editedStage ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedStage.acomptePrice}
                        onChange={(e) =>
                          setEditedStage({
                            ...editedStage,
                            acomptePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 h-8"
                        min="0"
                        step="0.01"
                      />
                      <span>€</span>
                    </div>
                  ) : (
                    <span className="font-semibold">{displayStage.acomptePrice}€</span>
                  )}
                </div>

                {/* Places - Editable avec boutons +/- */}
                <div className="flex justify-between items-center"></div>
                <span className="font-medium text-muted-foreground">
                  Places totales:
                </span>
                {isEditing && editedStage ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDecreasePlaces}
                      disabled={editedStage.places <= currentBookingsCount}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">
                      {editedStage.places}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleIncreasePlaces}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span>{displayStage.places}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">
                  Places restantes:
                </span>
                <span
                  className={`font-semibold ${
                    placesRestantes > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isEditing && editedStage
                    ? editedStage.places - currentBookingsCount
                    : placesRestantes}
                </span>
              </div>
            </div>
          </div>

          {/* Moniteurs - Editable */}
          <div>
            <h3 className="font-semibold mb-3">
              Moniteur{displayStage.moniteurs.length > 1 ? "s" : ""}
            </h3>
            {isEditing && editedStage ? (
              <div className="space-y-2">
                <Label htmlFor="moniteurs">Sélectionner des moniteurs</Label>
                <MultiSelect
                  options={
                    moniteurs?.map((moniteur) => ({
                      value: moniteur.id,
                      label: `${moniteur.name} (${
                        moniteur.role === "ADMIN" ? "Admin" : "Moniteur"
                      })`,
                    })) || []
                  }
                  onValueChange={(values) =>
                    setEditedStage({
                      ...editedStage,
                      moniteurIds: values,
                    })
                  }
                  defaultValue={editedStage.moniteurIds}
                  placeholder="Sélectionner des moniteurs"
                  variant="inverted"
                  maxCount={3}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {displayStage.moniteurs.map((moniteurData: any, index: number) => (
                  <div
                    key={moniteurData.moniteur.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={moniteurData.moniteur.avatarUrl}
                        alt={moniteurData.moniteur.name}
                      />
                      <AvatarFallback className="text-sm">
                        {moniteurData.moniteur.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {moniteurData.moniteur.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {moniteurData.moniteur.role === "ADMIN"
                          ? "Administrateur"
                          : "Moniteur"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Réservations */}
        <div>
          <h3 className="font-semibold mb-3">
            Réservations ({currentBookingsCount}/
            {isEditing && editedStage
              ? editedStage.places
              : displayStage.places}
            )
          </h3>
          {isLoadingDetails ? (
            <div className="text-sm text-muted-foreground">
              Chargement des réservations...
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {booking.stagiaire?.firstName}{" "}
                      {booking.stagiaire?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.stagiaire?.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.stagiaire?.phone}
                    </div>
                  </div>
                  <Badge variant="outline">{booking.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune réservation pour ce stage</p>
              <p className="text-sm mt-1">
                Les clients pourront bientôt réserver ce stage
              </p>
            </div>
          )}
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le stage</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce stage ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
                setShowDeleteDialog(false);
              }}
              disabled={deleteStage.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
