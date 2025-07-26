"use client";

import { CalendarScheduleBaptemes } from "./calendar-schedule-baptemes";
import { AddBaptemeDialog } from "./add-bapteme-dialog";
import { BaptemeDetailsDialog } from "./bapteme-details-dialog";
import { useState } from "react";
import { Bapteme, User } from "@prisma/client";
import { useGetAllBaptemes } from "@/features/biplaces/api/use-get-bapteme";
import { useCreateBapteme } from "@/features/biplaces/api/use-create-bapteme";

interface BaptemeWithMoniteur extends Bapteme {
  moniteur: User;
}

export default function Page() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(10); // Default hour
  const [selectedBapteme, setSelectedBapteme] = useState<BaptemeWithMoniteur | null>(null);

  // Fetch baptemes from API
  const { data: baptemesData, isLoading } = useGetAllBaptemes();
  const createBapteme = useCreateBapteme();

  // Transform API data to match the expected Bapteme type with additional info
  const baptemes = baptemesData?.map((bapteme) => ({
    id: bapteme.id,
    date: new Date(bapteme.date),
    duration: bapteme.duration,
    places: bapteme.places,
    price: bapteme.price,
    moniteurId: bapteme.moniteurId,
    moniteur: {
      ...bapteme.moniteur,
      createdAt: new Date(bapteme.moniteur.createdAt),
      updatedAt: new Date(bapteme.moniteur.updatedAt),
    },
    bookings: bapteme.bookings.map(booking => ({
      ...booking,
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt),
    })),
    placesRestantes: bapteme.places - bapteme.bookings.length,
  })) || [];

  // Keep the full data with moniteur for details dialog
  const baptemesWithMoniteur: BaptemeWithMoniteur[] = baptemesData?.map((bapteme) => ({
    id: bapteme.id,
    date: new Date(bapteme.date),
    duration: bapteme.duration,
    places: bapteme.places,
    price: bapteme.price,
    moniteurId: bapteme.moniteurId,
    moniteur: {
      id: bapteme.moniteur.id,
      email: bapteme.moniteur.email,
      name: bapteme.moniteur.name,
      avatarUrl: bapteme.moniteur.avatarUrl,
      role: bapteme.moniteur.role,
      createdAt: new Date(bapteme.moniteur.createdAt),
      updatedAt: new Date(bapteme.moniteur.updatedAt),
    },
  })) || [];

  const handleBaptemeClick = (bapteme: Bapteme) => {
    // Find the full bapteme data with moniteur info
    const fullBapteme = baptemesWithMoniteur.find(b => b.id === bapteme.id);
    if (fullBapteme) {
      setSelectedBapteme(fullBapteme);
      setShowDetailsDialog(true);
    }
  };

  const handleDayClick = (date: Date, hour?: number) => {
    console.log("Day clicked:", date, "Hour:", hour);
    setSelectedDate(date);
    if (hour !== undefined) {
      setSelectedHour(hour);
    }
    setShowAddForm(true);
  };

  const handleAddBapteme = () => {
    console.log("Add new bapteme");
    setSelectedDate(new Date());
    setSelectedHour(10); // Default to 10h
    setShowAddForm(true);
  };

  const handleCreateBapteme = (newBapteme: Omit<Bapteme, "id">) => {
    // Convert to the format expected by the API
    const baptemeData = {
      date: newBapteme.date.toISOString(),
      duration: newBapteme.duration,
      places: newBapteme.places,
      price: newBapteme.price,
      moniteurId: newBapteme.moniteurId,
    };

    createBapteme.mutate(baptemeData, {
      onSuccess: () => {
        setShowAddForm(false);
        setSelectedDate(null);
      },
    });
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Chargement des baptêmes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <CalendarScheduleBaptemes
        baptemes={baptemes}
        onBaptemeClick={handleBaptemeClick}
        onDayClick={handleDayClick}
        onAddBapteme={handleAddBapteme}
      />

      <AddBaptemeDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        onCreateBapteme={handleCreateBapteme}
      />

      <BaptemeDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        bapteme={selectedBapteme}
      />
    </main>
  );
}

export const fetchCache = "force-no-store";
