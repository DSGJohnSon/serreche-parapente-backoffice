import { Metadata } from "next";
import { Stagiaires } from "./stagiaires";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Stagiaires",
  description: "",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <Stagiaires />
    </main>
  );
}

export const fetchCache = "force-no-store";