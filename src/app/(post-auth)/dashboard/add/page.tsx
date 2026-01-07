"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomersAddForm from "@/features/customers/forms/customers-add-form";
import MonitorAddForm from "@/features/users/forms/monitor-add-form";
import ReservationStageAddForm from "@/features/reservations/stages/forms/reservationStage-add-form";
import BaptemeBiPlaceAddForm from "@/features/biplaces/forms/bapteme-biplace-add-form";
import { GiftCardAddForm } from "@/features/giftcards/forms/giftcard-add-form";
import { StageAddForm } from "@/features/stages/forms/stage-add-form";
import { useCreateStage } from "@/features/stages/api/use-create-stage";
import { StageType } from "@prisma/client";
import { useCurrent } from "@/features/auth/api/use-current";

export default function TabsDemo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const createStage = useCreateStage();

  const { data: user } = useCurrent();
  const role = user?.role;
  const userId = user?.id;

  const getInitialTab = () => {
    if (role === "MONITEUR") return "bapteme-biplace";
    return searchParams.get("type") || "customer";
  };

  const currentTab = getInitialTab();
  const selectedDate = searchParams.get("date")
    ? new Date(searchParams.get("date")!)
    : null;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("type", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const handleCreateStage = (newStage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurIds: string[];
    price: number;
    acomptePrice: number;
    type: StageType;
  }) => {
    const stageData = {
      startDate: newStage.startDate.toISOString(),
      duration: newStage.duration,
      places: newStage.places,
      moniteurIds: newStage.moniteurIds,
      price: newStage.price,
      acomptePrice: newStage.acomptePrice,
      type: newStage.type,
    };

    createStage.mutate(stageData, {
      onSuccess: () => {
        router.push("/dashboard/stages");
      },
    });
  };

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center h-[50vh]">
        <div className="text-lg text-muted-foreground animate-pulse">
          Chargement de votre session...
        </div>
      </div>
    );
  }

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
            <TabsTrigger value="bapteme-biplace">Bapteme BiPlace</TabsTrigger>
            {role === "ADMIN" && (
              <>
                <TabsTrigger value="stage">Stage</TabsTrigger>
                <TabsTrigger value="monitor">Moniteur</TabsTrigger>
              </>
            )}
          </TabsList>
          {role === "ADMIN" && (
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
          )}
          <TabsContent value="bapteme-biplace" className="w-full max-w-xl">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Bapteme BiPlace</CardTitle>
                <CardDescription>
                  Ajouter une nouvelle réservation de bapteme biplace à la base
                  de données.
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <BaptemeBiPlaceAddForm role={role} userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>
          {role === "ADMIN" && (
            <TabsContent value="stage" className="w-full max-w-xl">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Stage</CardTitle>
                  <CardDescription>
                    Ajouter un nouveau créneau de stage à la base de données.
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                  <StageAddForm
                    selectedDate={selectedDate}
                    onSubmit={handleCreateStage}
                    onCancel={() => router.push("/dashboard/stages")}
                    isSubmitting={createStage.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  );
}
