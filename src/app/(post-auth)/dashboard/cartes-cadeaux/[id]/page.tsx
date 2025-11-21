import { Metadata } from "next";
import { GiftCardDetails } from "./giftcard-details";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Détails Carte Cadeau",
  description: "Détails et historique d'utilisation d'une carte cadeau",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <GiftCardDetails id={id} />
    </main>
  );
}

export const fetchCache = "force-no-store";