"use client";

import { useGetDashboardStats } from "@/features/dashboard/api/use-get-dashboard-stats";
import { useGetMonitorSchedule } from "@/features/dashboard/api/use-get-monitor-schedule";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Euro,
  CreditCard,
  TrendingUp,
  Mountain,
  Plane,
  Calendar,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardStats();
  const { data: scheduleData, isLoading: isLoadingSchedule } =
    useGetMonitorSchedule();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">
            Erreur lors du chargement des statistiques
          </p>
        </div>
      </div>
    );
  }

  const { revenue, last13MonthsRevenue } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Monitor Daily Schedule - Only shown for monitors */}
      {scheduleData &&
        (scheduleData.stages.length > 0 ||
          scheduleData.baptemes.length > 0) && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Mes activités du jour</CardTitle>
                </div>
                <Badge variant="default" className="text-sm">
                  {format(new Date(), "d MMMM yyyy", { locale: fr })}
                </Badge>
              </div>
              <CardDescription>
                Vos stages et baptêmes programmés aujourd&apos;hui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stages */}
              {scheduleData.stages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Mountain className="h-4 w-4" />
                    <span>Stages ({scheduleData.stages.length})</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {scheduleData.stages.map((stage) => (
                      <Card key={stage.id} className="bg-background">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              Stage {stage.type}
                            </CardTitle>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {stage.bookingsCount}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {stage.duration} jours • Début:{" "}
                            {format(new Date(stage.startDate), "HH:mm", {
                              locale: fr,
                            })}
                          </CardDescription>
                        </CardHeader>
                        {stage.participants.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="text-xs space-y-1">
                              <p className="font-medium">Participants:</p>
                              {stage.participants.map((participant, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <p className="text-muted-foreground truncate">
                                    • {participant.name}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/reservations/${participant.id}`
                                      )
                                    }
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Baptemes */}
              {scheduleData.baptemes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Plane className="h-4 w-4" />
                    <span>Baptêmes ({scheduleData.baptemes.length})</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {scheduleData.baptemes.map((bapteme) => (
                      <Card key={bapteme.id} className="bg-background">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Baptême</CardTitle>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {bapteme.bookingsCount}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {bapteme.duration} min • Heure:{" "}
                            {format(new Date(bapteme.date), "HH:mm", {
                              locale: fr,
                            })}
                          </CardDescription>
                        </CardHeader>
                        {bapteme.participants.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="text-xs space-y-1">
                              <p className="font-medium">Participants:</p>
                              {bapteme.participants.map((participant, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <p className="text-muted-foreground truncate">
                                    • {participant.name} ({participant.category}
                                    )
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/reservations/${participant.id}`
                                      )
                                    }
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Upcoming Activities - Only shown if there are upcoming activities */}
      {scheduleData?.upcoming &&
        (scheduleData.upcoming.nextStage ||
          scheduleData.upcoming.nextBapteme) && (
          <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>À venir</CardTitle>
              </div>
              <CardDescription>
                Vos prochaines activités programmées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Next Stage */}
              {scheduleData.upcoming.nextStage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Mountain className="h-4 w-4" />
                    <span>Prochain stage</span>
                  </div>
                  <Card className="bg-background">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Stage {scheduleData.upcoming.nextStage.type}
                        </CardTitle>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {scheduleData.upcoming.nextStage.bookingsCount}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {scheduleData.upcoming.nextStage.duration} jours •
                        Début:{" "}
                        {format(
                          new Date(scheduleData.upcoming.nextStage.startDate),
                          "d MMMM yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </CardDescription>
                    </CardHeader>
                    {scheduleData.upcoming.nextStage.participants.length >
                      0 && (
                      <CardContent className="pt-0">
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Participants:</p>
                          {scheduleData.upcoming.nextStage.participants.map(
                            (participant, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2"
                              >
                                <p className="text-muted-foreground truncate">
                                  • {participant.name}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/reservations/${participant.id}`
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              )}

              {/* Next Bapteme */}
              {scheduleData.upcoming.nextBapteme && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Plane className="h-4 w-4" />
                    <span>Prochain baptême</span>
                  </div>
                  <Card className="bg-background">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Baptême</CardTitle>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {scheduleData.upcoming.nextBapteme.bookingsCount}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {scheduleData.upcoming.nextBapteme.duration} min •
                        Heure:{" "}
                        {format(
                          new Date(scheduleData.upcoming.nextBapteme.date),
                          "d MMMM yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </CardDescription>
                    </CardHeader>
                    {scheduleData.upcoming.nextBapteme.participants.length >
                      0 && (
                      <CardContent className="pt-0">
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Participants:</p>
                          {scheduleData.upcoming.nextBapteme.participants.map(
                            (participant, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2"
                              >
                                <p className="text-muted-foreground truncate">
                                  • {participant.name} ({participant.category})
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/reservations/${participant.id}`
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Revenue KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires du mois en cours
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue.onlineRevenueThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vente en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires du mois en cours
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue.totalRevenueThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total (en ligne + paiements manuels)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d&apos;affaires de l&apos;année en cours
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue.totalRevenueThisYear)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart - Last 13 Months */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
          <CardDescription>
            Chiffre d&apos;affaires total des 13 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={last13MonthsRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `${value.toLocaleString("fr-FR")}€`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString("fr-FR")}€`,
                  "Chiffre d'affaires",
                ]}
                labelStyle={{ color: "#000" }}
              />
              <Legend />
              <Bar
                dataKey="total"
                fill="#8884d8"
                name="Chiffre d'affaires total"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
