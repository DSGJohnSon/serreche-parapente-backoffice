"use client";

import { CalendarScheduleBaptemes } from "./calendar-schedule-baptemes";
import { AddBaptemeDialog } from "./add-bapteme-dialog";
import { BaptemeDetailsDialog } from "./bapteme-details-dialog";
import { useState, useEffect } from "react";
import { Bapteme, User, BaptemeBooking } from "@prisma/client";
import { useGetAllBaptemes } from "@/features/biplaces/api/use-get-bapteme";
import { useCreateBapteme } from "@/features/biplaces/api/use-create-bapteme";
import { BaptemeCategory } from "@/features/biplaces/schemas";

// Type for the API response from the server
interface BaptemeApiResponse extends Omit<Bapteme, 'categories'> {
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: BaptemeBooking[];
  categories: BaptemeCategory[];
}

interface BaptemeWithMoniteurs extends Omit<Bapteme, 'categories'> {
  moniteurs: Array<{
    moniteur: User;
  }>;
  categories: BaptemeCategory[];
}

interface BaptemeData {
  date: Date;
  duration: number;
  places: number;
  moniteurIds: string[];
  categories: BaptemeCategory[];
  acomptePrice: number;
}

export default function Page() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(10); // Default hour
  const [selectedBapteme, setSelectedBapteme] = useState<BaptemeWithMoniteurs | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch baptemes from API
  const { data: baptemesData, isLoading } = useGetAllBaptemes();
  const createBapteme = useCreateBapteme();

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

  // Transform API data to match the expected Bapteme type with additional info
  const baptemes = baptemesData?.map((bapteme: BaptemeApiResponse) => ({
    id: bapteme.id,
    date: new Date(bapteme.date),
    duration: bapteme.duration,
    places: bapteme.places,
    categories: bapteme.categories || [],
    moniteurs: bapteme.moniteurs.map(m => ({
      moniteur: {
        ...m.moniteur,
        createdAt: new Date(m.moniteur.createdAt),
        updatedAt: new Date(m.moniteur.updatedAt),
      }
    })),
    bookings: bapteme.bookings.map(booking => ({
      ...booking,
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt),
    })),
    placesRestantes: bapteme.places - bapteme.bookings.length,
  })) || [];

  // Keep the full data with moniteurs for details dialog
  const baptemesWithMoniteurs: BaptemeWithMoniteurs[] = baptemesData?.map((bapteme: BaptemeApiResponse) => ({
    id: bapteme.id,
    date: new Date(bapteme.date),
    duration: bapteme.duration,
    places: bapteme.places,
    acomptePrice: bapteme.acomptePrice,
    categories: bapteme.categories || [],
    createdAt: new Date(bapteme.createdAt),
    updatedAt: new Date(bapteme.updatedAt),
    moniteurs: bapteme.moniteurs.map(m => ({
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
  })) || [];

  const handleBaptemeClick = (bapteme: Bapteme) => {
    // Find the full bapteme data with moniteurs info
    const fullBapteme = baptemesWithMoniteurs.find(b => b.id === bapteme.id);
    if (fullBapteme) {
      setSelectedBapteme(fullBapteme);
      setShowDetailsDialog(true);
    }
  };

  const handleDayClick = (date: Date, hour?: number) => {
    console.log("Day clicked:", date, "Hour:", hour);
    // Redirect to add page with date and hour parameters
    const params = new URLSearchParams({
      type: 'bapteme-biplace',
      date: date.toISOString(),
      ...(hour !== undefined && { hour: hour.toString() })
    });
    window.location.href = `/dashboard/add?${params.toString()}`;
  };

  const handleAddBapteme = () => {
    console.log("Add new bapteme");
    // Redirect to add page
    window.location.href = '/dashboard/add?type=bapteme-biplace';
  };

  const handleCreateBapteme = (newBapteme: BaptemeData) => {
    // Convert to the format expected by the API
    const baptemeData = {
      date: newBapteme.date.toISOString(),
      duration: newBapteme.duration,
      places: newBapteme.places,
      categories: newBapteme.categories,
      moniteurIds: newBapteme.moniteurIds,
      acomptePrice: newBapteme.acomptePrice,
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
    <main className="flex flex-1 flex-col gap-4 p-4">
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
