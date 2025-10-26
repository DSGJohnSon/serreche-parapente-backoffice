import { Metadata } from "next";
import { Clients } from "./clients";

export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Clients",
  description: "",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <Clients />
    </main>
  );
}

export const fetchCache = "force-no-store";