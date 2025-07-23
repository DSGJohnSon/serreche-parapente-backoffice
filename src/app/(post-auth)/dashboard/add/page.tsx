"use client";

import { AppWindowIcon, CodeIcon } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomersAddForm from "@/features/customers/forms/customers-add-form";
import MonitorAddForm from "@/features/users/forms/monitor-add-form";
import ReservationStageAddForm from "@/features/reservations/stages/forms/reservationStage-add-form";

export default function TabsDemo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("type") || "customer";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("type", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-16">
      <h1 className="text-2xl font-bold">
        Ajouter une nouvelle instance à la base de données.
      </h1>
      <div className="flex w-full flex-col gap-6">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="customer">Client</TabsTrigger>
            <TabsTrigger value="monitor">Moniteur</TabsTrigger>
            <TabsTrigger value="reservation-stage">
              Réservation de stage
            </TabsTrigger>
          </TabsList>
          <TabsContent value="customer" className="w-full max-w-xl">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Client</CardTitle>
                <CardDescription>
                  Ajouter un nouveau client à la base de données.
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <CustomersAddForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monitor" className="w-full max-w-xl">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Moniteur</CardTitle>
                <CardDescription>
                  Ajouter un nouveau moniteur à la base de données.
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <MonitorAddForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reservation-stage" className="w-full max-w-xl">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Réservation de stage</CardTitle>
                <CardDescription>
                  Ajouter une nouvelle réservation de stage à la base de
                  données.
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <ReservationStageAddForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
