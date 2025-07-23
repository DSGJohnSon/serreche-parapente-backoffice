import { CheckCircle2Icon, LucidePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MonitorsStatsProps {
  monitors: User[];
}

export function MonitorsStats({ monitors }: MonitorsStatsProps) {
  const totalMonitors = monitors.length;

  return (
    <div className="w-full flex items-center justify-between mb-6">
      <Card className="w-1/3">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Moniteurs</p>
              <p className="text-2xl font-bold">{totalMonitors}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Link href="/dashboard/add?type=monitor" className="ml-4">
        <Button className="ml-4">
          <LucidePlus className="mr-2 h-4 w-4" />
          <span className="text-sm">Ajouter un Moniteur</span>
        </Button>
      </Link>
    </div>
  );
}
