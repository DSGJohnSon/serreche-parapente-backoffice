import { Metadata } from "next";
import { GiftCardDetails } from "./giftcard-details";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Détails Bon Cadeau",
  description: "Détails et historique d'utilisation d'un bon cadeau",
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