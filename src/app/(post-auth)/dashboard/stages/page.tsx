import { WeeklySchedule } from "@/features/stages/components/stage-schedule";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Stage de Parapente - BackOffice | Planning",
  description: "",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <WeeklySchedule/>
    </main>
  );
}

export const fetchCache = "force-no-store";
