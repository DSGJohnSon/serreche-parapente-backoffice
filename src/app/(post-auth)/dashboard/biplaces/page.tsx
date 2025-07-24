"use client";

import { CalendarScheduleBaptemes } from "./calendar-schedule-baptemes";
import { AddBaptemeDialog } from "./add-bapteme-dialog";
import { useState } from "react";
import { Bapteme } from "@prisma/client";

// Mock data for demonstration
const mockBaptemes: Bapteme[] = [
  {
    id: "1",
    date: new Date(2025, 0, 23, 10, 0), // January 23, 2025 at 10:00
    duration: 120,
    places: 6,
    moniteurId: "user1",
    price: 120.0,
  },
  {
    id: "2",
    date: new Date(2025, 0, 23, 14, 30), // January 23, 2025 at 14:30
    duration: 90,
    places: 4,
    moniteurId: "user2",
    price: 120.0,
  },
  {
    id: "3",
    date: new Date(2025, 0, 24, 9, 0), // January 24, 2025 at 9:00
    duration: 150,
    places: 8,
    moniteurId: "user1",
    price: 120.0,
  },
  {
    id: "4",
    date: new Date(2025, 0, 24, 15, 0), // January 24, 2025 at 15:00
    duration: 120,
    places: 6,
    moniteurId: "user3",
    price: 120.0,
  },
  {
    id: "5",
    date: new Date(2025, 0, 25, 11, 0), // January 25, 2025 at 11:00
    duration: 180,
    places: 10,
    moniteurId: "user2",
    price: 120.0,
  },
  {
    id: "6",
    date: new Date(2025, 0, 26, 8, 30), // January 26, 2025 at 8:30
    duration: 120,
    places: 6,
    moniteurId: "user1",
    price: 120.0,
  },
  {
    id: "7",
    date: new Date(2025, 0, 26, 13, 0), // January 26, 2025 at 13:00
    duration: 90,
    places: 4,
    moniteurId: "user3",
    price: 120.0,
  },
  {
    id: "8",
    date: new Date(2025, 0, 27, 10, 30), // January 27, 2025 at 10:30
    duration: 120,
    places: 8,
    moniteurId: "user2",
    price: 120.0,
  },
  {
    id: "9",
    date: new Date(2025, 0, 28, 14, 0), // January 28, 2025 at 14:00
    duration: 150,
    places: 6,
    moniteurId: "user1",
    price: 120.0,
  },
  {
    id: "10",
    date: new Date(2025, 0, 29, 9, 15), // January 29, 2025 at 9:15
    duration: 105,
    places: 5,
    moniteurId: "user3",
    price: 120.0,
  },
];

export default function Page() {
  const [baptemes, setBaptemes] = useState<Bapteme[]>(mockBaptemes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleBaptemeClick = (bapteme: Bapteme) => {
    console.log("Bapteme clicked:", bapteme);
    // Here you would typically open a detailed view or edit modal
  };

  const handleDayClick = (date: Date) => {
    console.log("Day clicked:", date);
    setSelectedDate(date);
    setShowAddForm(true);
  };

  const handleAddBapteme = () => {
    console.log("Add new bapteme");
    setSelectedDate(new Date());
    setShowAddForm(true);
  };

  const handleCreateBapteme = (newBapteme: Omit<Bapteme, "id">) => {
    const bapteme: Bapteme = {
      ...newBapteme,
      id: `bapteme_${Date.now()}`,
    };
    setBaptemes((prev) => [...prev, bapteme]);
    setShowAddForm(false);
    setSelectedDate(null);
  };

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
        onCreateBapteme={handleCreateBapteme}
      />
    </main>
  );
}

export const fetchCache = "force-no-store";
