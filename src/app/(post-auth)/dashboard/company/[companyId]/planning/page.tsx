import { WeeklySchedule } from "@/features/weeks/components/week-schedule";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "GoDigital - Dashboard",
  description: "",
};

export default async function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <WeeklySchedule/>
    </main>
  );
}

export const fetchCache = "force-no-store";
