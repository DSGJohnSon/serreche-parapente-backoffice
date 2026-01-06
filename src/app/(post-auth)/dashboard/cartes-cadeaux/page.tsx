import { Metadata } from "next";
import { GiftCards } from "./giftcards";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Cartes Cadeaux",
  description: "Gestion des cartes cadeaux",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-8 lg:p-16">
      <GiftCards />
    </main>
  );
}

export const fetchCache = "force-no-store";
