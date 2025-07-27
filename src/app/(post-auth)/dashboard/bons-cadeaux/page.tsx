import { Metadata } from "next";
import { GiftCards } from "./giftcards";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Bons Cadeaux",
  description: "Gestion des bons cadeaux",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <GiftCards />
    </main>
  );
}

export const fetchCache = "force-no-store";