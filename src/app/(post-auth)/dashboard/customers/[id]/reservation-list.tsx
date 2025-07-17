import React, { useState } from "react";
import { Calendar, Clock, Users, Filter, Search, Eye } from "lucide-react";
import { Stage, StageBooking, StageBookingType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ReservationsListProps {
  bookings: (StageBooking & { stage: Stage })[];
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  bookings,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const getStageTypeLabel = (type: StageBookingType) => {
    const labels = {
      [StageBookingType.INITIATION]: "Initiation",
      [StageBookingType.PROGRESSION]: "Progression",
      [StageBookingType.AUTONOMIE]: "Autonomie",
    };
    return labels[type];
  };

  const getStageTypeVariant = (type: StageBookingType) => {
    const variants = {
      [StageBookingType.INITIATION]: "default",
      [StageBookingType.PROGRESSION]: "outline",
      [StageBookingType.AUTONOMIE]: "secondary",
    };
    return variants[type] as "default" | "secondary" | "outline";
  };

  const getBookingStatus = (
    booking: StageBooking & {
      stage: Stage;
    }
  ) => {
    const now = new Date();
    const startDate = new Date(booking.stage.startDate);
    const endDate = new Date(booking.stage.endDate);

    if (now < startDate) {
      return { label: "À venir", variant: "default" as const };
    } else if (now >= startDate && now <= endDate) {
      return { label: "En cours", variant: "secondary" as const };
    } else {
      return { label: "Terminé", variant: "outline" as const };
    }
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateRange = (
    startDate: string | Date,
    endDate: string | Date
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(
        "fr-FR",
        { month: "long", year: "numeric" }
      )}`;
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchTerm === "" ||
      getStageTypeLabel(booking.type)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.stage.year.toString().includes(searchTerm);

    const matchesFilter = filterType === "ALL" || booking.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle className="text-2xl">
            Réservations ({bookings.length})
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {Object.values(StageBookingType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getStageTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Aucune réservation trouvée
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "ALL"
                ? "Essayez de modifier vos critères de recherche."
                : "Ce client n'a pas encore de réservations."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => {
              const status = getBookingStatus(booking);
              return (
                <Card
                  key={booking.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">
                          Stage Semaine {booking.stage.weekNumber}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={getStageTypeVariant(booking.type)}>
                            {getStageTypeLabel(booking.type)}
                          </Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-3" />
                        <span className="text-sm">
                          {formatDateRange(
                            booking.stage.startDate,
                            booking.stage.endDate
                          )}
                        </span>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-3" />
                        <span className="text-sm">
                          {booking.stage.places} places disponibles
                        </span>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-3" />
                        <span className="text-sm">
                          Réservé le {formatDate(booking.createdAt)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        ID: {booking.id}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
