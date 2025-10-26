import { CheckCircle2Icon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Stagiaire, StageBooking, BaptemeBooking } from "@prisma/client";

interface StagiaireStatsProps {
  stagiaires: (Stagiaire & {
    bookings: (StageBooking | BaptemeBooking)[];
  })[];
}

export function StagiaireStats({ stagiaires }: StagiaireStatsProps) {
  const totalStagiaires = stagiaires.length;
  const totalBookings = stagiaires.reduce(
    (acc, stagiaire) => acc + stagiaire.bookings.length,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Stagiaires</p>
              <p className="text-2xl font-bold">{totalStagiaires}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Réservations</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}