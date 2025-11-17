"use client";

import { useState } from "react";
import { useGetDashboardStats } from "@/features/dashboard/api/use-get-dashboard-stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Euro,
  Calendar,
  Gift,
  CreditCard,
  UserCheck,
  Plane,
  Mountain,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedMonth = format(selectedDate, "yyyy-MM");
  
  const { data, isLoading } = useGetDashboardStats(selectedMonth);

  const handlePreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = format(new Date(), "yyyy-MM") === selectedMonth;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  const { overview, orders, stages, baptemes, giftCards, reservations, payments } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "En attente", variant: "outline" },
      PAID: { label: "Payé", variant: "default" },
      PARTIALLY_PAID: { label: "Partiellement payé", variant: "secondary" },
      FULLY_PAID: { label: "Entièrement payé", variant: "default" },
      CONFIRMED: { label: "Confirmé", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(value).toFixed(1)}% vs mois dernier
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium capitalize">
              {format(selectedDate, "MMMM yyyy", { locale: fr })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {!isCurrentMonth && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCurrentMonth}
              className="ml-2"
            >
              Retour au mois actuel
            </Button>
          )}
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total (Commandes)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.revenueThisMonth)}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(overview.totalRevenue)}
              </p>
              {isCurrentMonth && <GrowthIndicator value={overview.revenueGrowth} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Encaissé</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.collectedRevenueThisMonth)}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(overview.totalCollectedRevenue)}
              </p>
              {isCurrentMonth && <GrowthIndicator value={overview.collectedRevenueGrowth} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.ordersThisMonth}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total: {overview.totalOrders}
              </p>
              {isCurrentMonth && <GrowthIndicator value={overview.ordersGrowth} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.clientsThisMonth}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total: {overview.totalClients}
              </p>
              {isCurrentMonth && <GrowthIndicator value={overview.clientsGrowth} />}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.stagiairesThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {overview.totalStagiaires}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stages</CardTitle>
            <Mountain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stages.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {stages.total} ({stages.upcoming} à venir)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baptêmes</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{baptemes.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {baptemes.total} ({baptemes.upcoming} à venir)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bons cadeaux actifs</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giftCards.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valeur: {formatCurrency(giftCards.totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {data?.chartData && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
            <CardDescription>
              Comparaison entre CA total (commandes) et CA encaissé (paiements) pour {format(selectedDate, "MMMM yyyy", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  label={{ value: 'Jour du mois', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Montant (€)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}€`, '']}
                  labelFormatter={(label) => `Jour ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="CA Total (Commandes)"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="collectedRevenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="CA Encaissé (Paiements)"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>Les 5 dernières commandes enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.recent.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    {order.client ? (
                      <div>
                        <div className="font-medium">
                          {order.client.firstName} {order.client.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{order.client.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
