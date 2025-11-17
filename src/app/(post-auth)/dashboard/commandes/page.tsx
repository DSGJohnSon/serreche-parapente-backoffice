import { Metadata } from "next";
import { OrdersList } from "./orders-list";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Commandes",
  description: "Gestion des commandes",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <OrdersList />
    </main>
  );
}

export const fetchCache = "force-no-store";