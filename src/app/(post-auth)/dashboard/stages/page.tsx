"use client";

import { CalendarScheduleStages } from "@/features/stages/components/calendar-schedule-stages";
import { StageDetailsSheet } from "@/features/stages/components/stage-details-sheet";
import { useState, useEffect } from "react";
import { Stage, User, StageBooking, StageType } from "@prisma/client";
import { useGetAllStages } from "@/features/stages/api/use-get-stage";

// Type for the API response from the server
interface StageApiResponse extends Stage {
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: StageBooking[];
}

interface StageWithDetails {
  id: string;
  startDate: Date;
  duration: number;
  places: number;
  price: number;
  acomptePrice: number;
  allTimeHighPrice: number;
  type: StageType;
  createdAt: Date;
  updatedAt: Date;
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: any[];
  placesRestantes?: number;
}

export default function Page() {
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedStage, setSelectedStage] = useState<StageWithDetails | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch stages from API
  const { data: stagesData, isLoading } = useGetAllStages();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Chargement...</div>
        </div>
      </main>
    );
  }

  // Transform API data to match the expected Stage type with additional info
  const stages = stagesData?.map((stage: StageApiResponse) => ({
    id: stage.id,
    startDate: new Date(stage.startDate),
    duration: stage.duration,
    places: stage.places,
    price: stage.price,
    acomptePrice: stage.acomptePrice,
    allTimeHighPrice: stage.allTimeHighPrice,
    type: stage.type,
    createdAt: new Date(stage.createdAt),
    updatedAt: new Date(stage.updatedAt),
    moniteurs: stage.moniteurs.map(m => ({
      moniteur: {
        ...m.moniteur,
        createdAt: new Date(m.moniteur.createdAt),
        updatedAt: new Date(m.moniteur.updatedAt),
      }
    })),
    bookings: stage.bookings || [],
    placesRestantes: stage.places - (stage.bookings?.length || 0),
  })) || [];

  // Keep the full data with moniteurs for details sheet
  const stagesWithDetails: StageWithDetails[] = stagesData?.map((stage: StageApiResponse) => ({
    id: stage.id,
    startDate: new Date(stage.startDate),
    duration: stage.duration,
    places: stage.places,
    price: stage.price,
    acomptePrice: stage.acomptePrice,
    allTimeHighPrice: stage.allTimeHighPrice,
    type: stage.type,
    createdAt: new Date(stage.createdAt),
    updatedAt: new Date(stage.updatedAt),
    moniteurs: stage.moniteurs.map(m => ({
      moniteur: {
        id: m.moniteur.id,
        email: m.moniteur.email,
        name: m.moniteur.name,
        avatarUrl: m.moniteur.avatarUrl,
        role: m.moniteur.role,
        createdAt: new Date(m.moniteur.createdAt),
        updatedAt: new Date(m.moniteur.updatedAt),
      }
    })),
    bookings: stage.bookings || [],
  })) || [];

  const handleStageClick = (stage: StageWithDetails) => {
    // Find the full stage data with moniteur info
    const fullStage = stagesWithDetails.find(s => s.id === stage.id);
    if (fullStage) {
      setSelectedStage(fullStage);
      setShowDetailsSheet(true);
    }
  };

  const handleDayClick = (date: Date) => {
    console.log("Day clicked:", date);
    // Redirect to add page with date parameter
    const params = new URLSearchParams({
      type: 'stage',
      date: date.toISOString(),
    });
    window.location.href = `/dashboard/add?${params.toString()}`;
  };

  const handleAddStage = () => {
    console.log("Add new stage");
    // Redirect to add page
    window.location.href = '/dashboard/add?type=stage';
  };


  // Show loading state while fetching data
  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Chargement des stages...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="h-[calc(100vh-120px)]">
        <CalendarScheduleStages
          stages={stages as any}
          onStageClick={handleStageClick}
          onDayClick={handleDayClick}
          onAddStage={handleAddStage}
        />
      </div>


      <StageDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        stage={selectedStage}
      />
    </main>
  );
}

export const fetchCache = "force-no-store";
