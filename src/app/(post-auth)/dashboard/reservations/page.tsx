import { Metadata } from "next";
import { ReservationsView } from "./reservations-view";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Réservations",
  description: "Gestion des réservations de stages et baptêmes",
};

export default async function ReservationsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <ReservationsView />
    </main>
  );
}

export const fetchCache = "force-no-store";