"use client";

import { useState } from "react";
import { useGetAllStagiaires } from "@/features/stagiaires/api/use-get-stagiaires";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  LucideSearch,
  LucideUser,
  LucideMail,
  LucidePhone,
  LucideCalendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Stagiaire, StageBooking, BaptemeBooking } from "@prisma/client";
import CopyTextComponent from "@/components/copy-text-component";

type StagiaireWithBookings = Stagiaire & {
  stageBookings: StageBooking[];
  baptemeBookings: BaptemeBooking[];
};

export function StagiairesList() {
  const { data: stagiairesData, isLoading } = useGetAllStagiaires();
  const [searchQuery, setSearchQuery] = useState("");

  const transformedStagiairesData: StagiaireWithBookings[] | undefined =
    stagiairesData?.map((stagiaire) => ({
      ...stagiaire,
      createdAt: new Date(stagiaire.createdAt),
      updatedAt: new Date(stagiaire.updatedAt),
      birthDate: stagiaire.birthDate ? new Date(stagiaire.birthDate) : null,
      stageBookings: stagiaire.stageBookings.map((sb) => ({
        ...sb,
        createdAt: new Date(sb.createdAt),
        updatedAt: new Date(sb.updatedAt),
      })),
      baptemeBookings: stagiaire.baptemeBookings.map((bb) => ({
        ...bb,
        createdAt: new Date(bb.createdAt),
        updatedAt: new Date(bb.updatedAt),
      })),
    }));

  const filteredStagiaires = transformedStagiairesData?.filter((stagiaire) => {
    const query = searchQuery.toLowerCase();
    return (
      stagiaire.firstName.toLowerCase().includes(query) ||
      stagiaire.lastName.toLowerCase().includes(query) ||
      stagiaire.email.toLowerCase().includes(query) ||
      stagiaire.phone.toLowerCase().includes(query) ||
      stagiaire.id.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Stagiaires
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez tous les stagiaires de votre établissement
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un stagiaire</CardTitle>
          <CardDescription>
            Recherchez par nom, email ou téléphone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <LucideSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stagiaires Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des stagiaires</CardTitle>
          <CardDescription>
            {filteredStagiaires?.length || 0} stagiaire(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Informations</TableHead>
                  <TableHead>Réservations</TableHead>
                  <TableHead>Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredStagiaires || filteredStagiaires.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun stagiaire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStagiaires.map((stagiaire) => {
                    const totalBookings =
                      stagiaire.stageBookings.length +
                      stagiaire.baptemeBookings.length;
                    return (
                      <TableRow key={stagiaire.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                              <LucideUser className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {stagiaire.firstName} {stagiaire.lastName}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  ID: {stagiaire.id.slice(0, 8)}...
                                </span>
                                <CopyTextComponent
                                  text={stagiaire.id}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <LucideMail className="h-3 w-3 text-muted-foreground" />
                              <span>{stagiaire.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <LucidePhone className="h-3 w-3 text-muted-foreground" />
                              <span>{stagiaire.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {stagiaire.birthDate && (
                              <div className="flex items-center gap-2">
                                <LucideCalendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Né(e) le{" "}
                                  {format(stagiaire.birthDate, "dd/MM/yyyy", {
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">
                                Taille: {stagiaire.height}cm
                              </span>
                              <span className="text-muted-foreground">
                                Poids: {stagiaire.weight}kg
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary">
                              {totalBookings} réservation
                              {totalBookings > 1 ? "s" : ""}
                            </Badge>
                            {stagiaire.stageBookings.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {stagiaire.stageBookings.length} stage
                                {stagiaire.stageBookings.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {stagiaire.baptemeBookings.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {stagiaire.baptemeBookings.length} baptême
                                {stagiaire.baptemeBookings.length > 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(
                                new Date(stagiaire.createdAt),
                                "dd/MM/yyyy",
                                { locale: fr }
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(stagiaire.createdAt), "HH:mm", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
