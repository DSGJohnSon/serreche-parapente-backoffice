"use client";

import { CalendarScheduleStages } from "@/features/stages/components/calendar-schedule-stages";
import { AddStageSheet } from "@/features/stages/components/add-stage-sheet";
import { StageDetailsSheet } from "@/features/stages/components/stage-details-sheet";
import { useState } from "react";
import { Stage, User, StageBooking, Customer, StageType } from "@prisma/client";
import { useGetAllStages } from "@/features/stages/api/use-get-stage";
import { useCreateStage } from "@/features/stages/api/use-create-stage";

interface StageWithDetails {
  id: string;
  startDate: Date;
  duration: number;
  places: number;
  price: number;
  type: StageType;
  moniteurId: string;
  createdAt: Date;
  updatedAt: Date;
  moniteur: User;
  bookings: any[];
  placesRestantes?: number;
}

export default function Page() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageWithDetails | null>(null);

  // Fetch stages from API
  const { data: stagesData, isLoading } = useGetAllStages();
  const createStage = useCreateStage();

  // Transform API data to match the expected Stage type with additional info
  const stages = stagesData?.map((stage) => ({
    id: stage.id,
    startDate: new Date(stage.startDate),
    duration: stage.duration,
    places: stage.places,
    price: stage.price,
    type: stage.type,
    moniteurId: stage.moniteurId,
    createdAt: new Date(stage.createdAt),
    updatedAt: new Date(stage.updatedAt),
    moniteur: {
      ...stage.moniteur,
      createdAt: new Date(stage.moniteur.createdAt),
      updatedAt: new Date(stage.moniteur.updatedAt),
    },
    bookings: stage.bookings || [],
    placesRestantes: stage.places - (stage.bookings?.length || 0),
  })) || [];

  // Keep the full data with moniteur for details sheet
  const stagesWithDetails: StageWithDetails[] = stagesData?.map((stage) => ({
    id: stage.id,
    startDate: new Date(stage.startDate),
    duration: stage.duration,
    places: stage.places,
    price: stage.price,
    type: stage.type,
    moniteurId: stage.moniteurId,
    createdAt: new Date(stage.createdAt),
    updatedAt: new Date(stage.updatedAt),
    moniteur: {
      id: stage.moniteur.id,
      email: stage.moniteur.email,
      name: stage.moniteur.name,
      avatarUrl: stage.moniteur.avatarUrl,
      role: stage.moniteur.role,
      createdAt: new Date(stage.moniteur.createdAt),
      updatedAt: new Date(stage.moniteur.updatedAt),
    },
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
    setSelectedDate(date);
    setShowAddForm(true);
  };

  const handleAddStage = () => {
    console.log("Add new stage");
    setSelectedDate(new Date());
    setShowAddForm(true);
  };

  const handleCreateStage = (newStage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurId: string;
    price: number;
    type: StageType;
  }) => {
    // Convert to the format expected by the API
    const stageData = {
      startDate: newStage.startDate.toISOString(),
      duration: newStage.duration,
      places: newStage.places,
      moniteurId: newStage.moniteurId,
      price: newStage.price,
      type: newStage.type,
    };

    createStage.mutate(stageData, {
      onSuccess: () => {
        setShowAddForm(false);
        setSelectedDate(null);
      },
    });
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

      <AddStageSheet
        open={showAddForm}
        onOpenChange={setShowAddForm}
        selectedDate={selectedDate}
        onCreateStage={handleCreateStage}
      />

      <StageDetailsSheet
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        stage={selectedStage}
      />
    </main>
  );
}

export const fetchCache = "force-no-store";
