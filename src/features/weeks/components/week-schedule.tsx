"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  LucideExternalLink,
} from "lucide-react";
import {
  format,
  addMonths,
  getYear,
  isSameMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  setWeek,
  startOfYear,
  lastDayOfYear,
  getISOWeeksInYear,
} from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCreateWeek } from "../api/use-create-week";
import { Booking, WeekType } from "@prisma/client";
import { useGetAllWeeks } from "../api/use-get-week";
import { useUpdateWeek } from "../api/use-update-week";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Types pour les données
type ScheduleOption = WeekType;
type ViewMode = "month" | "year";

interface WeekSchedule {
  id?: string;
  weekNumber: number;
  startDate: string; // Les dates sont des chaînes au format ISO
  endDate: string;
  type: ScheduleOption;
  year: number;
  places: number;
  bookings: Booking[];
}

interface WeeklyScheduleProps {
  initialYear?: number;
  onScheduleChange?: (weekSchedules: WeekSchedule[]) => void;
}

// Options disponibles pour le select
const scheduleOptions = [
  { value: "INITIATION", label: "INITIATION" },
  { value: "PROGRESSION", label: "PROGRESSION" },
  { value: "DOUBLE", label: "DOUBLE" },
  { value: "NONE", label: "Aucun stage" },
];

// Couleurs pour les options
const optionColors: Record<
  ScheduleOption,
  {
    bg: string;
    border: string;
    text: string;
    selectBg: string;
    hoverBg: string;
  }
> = {
  INITIATION: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "",
    selectBg: "bg-sky-100",
    hoverBg: "hover:bg-sky-200",
  },
  PROGRESSION: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "",
    selectBg: "bg-teal-100",
    hoverBg: "hover:bg-teal-200",
  },
  DOUBLE: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "",
    selectBg: "bg-orange-100",
    hoverBg: "hover:bg-orange-200",
  },
  NONE: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "",
    selectBg: "bg-gray-100",
    hoverBg: "hover:bg-gray-200",
  },
};

// Fonction pour générer toutes les semaines d'une année
function generateWeeksForYear(year: number): WeekSchedule[] {
  const weeks: WeekSchedule[] = [];
  const firstDay = startOfYear(new Date(year, 0, 1));
  const lastDay = lastDayOfYear(new Date(year, 0, 1));
  const totalWeeks = getISOWeeksInYear(new Date(year, 0, 1));

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    // Créer une date pour la semaine spécifiée
    const weekDate = setWeek(new Date(year, 0, 1), weekNum, {
      weekStartsOn: 1,
    });
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

    // S'assurer que nous ne dépassons pas les limites de l'année
    if (weekStart.getTime() > lastDay.getTime()) continue;

    weeks.push({
      weekNumber: weekNum,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      type: "NONE",
      year,
      places: 6,
      bookings: [],
    });
  }

  return weeks;
}

export function WeeklySchedule({
  initialYear = new Date().getFullYear(),
  onScheduleChange,
}: WeeklyScheduleProps) {
  //IMPORT & INITIALISATION
  const { mutate: createWeek, isPending: creationPending } = useCreateWeek();
  const { mutate: updateWeek, isPending: updatePending } = useUpdateWeek();
  const { data: weeksData, isLoading: isLoadingWeeks } = useGetAllWeeks();
  const [initialData, setInitialData] = useState<WeekSchedule[]>([]);

  const pathname = usePathname();

  useEffect(() => {
    console.log("weeksData:", weeksData);
    setInitialData(
      weeksData?.data.map((week) => ({
        ...week,
        bookings: week.bookings.map((booking) => ({
          ...booking,
          startDate: new Date(booking.startDate),
          endDate: new Date(booking.endDate),
        })),
      })) || []
    );
  }, [weeksData]);

  // Calculer les années disponibles et générer toutes les semaines
  const { availableYears, allWeeks } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsWithData = new Set<number>();

    // Ajouter toutes les années qui ont des données
    initialData.forEach((week) => {
      if (week.type !== "NONE") {
        yearsWithData.add(week.year);
      }
    });

    // Ajouter l'année actuelle et l'année suivante
    const years = [currentYear, currentYear + 1];

    // Ajouter les années précédentes qui ont des données
    yearsWithData.forEach((year) => {
      if (year < currentYear && !years.includes(year)) {
        years.push(year);
      }
    });

    const sortedYears = years.sort((a, b) => a - b);

    // Générer toutes les semaines pour les années disponibles
    let weeks: WeekSchedule[] = [];

    sortedYears.forEach((year) => {
      weeks = [...weeks, ...generateWeeksForYear(year)];
    });

    return { availableYears: sortedYears, allWeeks: weeks };
  }, [initialData]);

  // Limites d'années
  const minYear = Math.min(...availableYears);
  const maxYear = Math.max(...availableYears);

  // État pour l'année actuellement sélectionnée
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // État pour stocker les données du planning
  const [scheduleData, setScheduleData] = useState<WeekSchedule[]>(() => {
    // Créer un Map pour un accès rapide aux données initiales
    const dataMap = new Map<string, WeekSchedule>();

    initialData.forEach((week) => {
      const key = `${week.year}-${week.weekNumber}`;
      dataMap.set(key, week);
    });

    // Mettre à jour les semaines générées avec les données initiales
    return allWeeks.map((week) => {
      const key = `${week.year}-${week.weekNumber}`;
      return dataMap.has(key) ? dataMap.get(key)! : week;
    });
  });

  // Mettre à jour scheduleData lorsque initialData change
  useEffect(() => {
    const dataMap = new Map<string, WeekSchedule>();
    initialData.forEach((week) => {
      const key = `${week.year}-${week.weekNumber}`;
      dataMap.set(key, week);
    });

    const updatedScheduleData = allWeeks.map((week) => {
      const key = `${week.year}-${week.weekNumber}`;
      return dataMap.has(key) ? dataMap.get(key)! : week;
    });

    setScheduleData(updatedScheduleData);
  }, [initialData, allWeeks]);

  // État pour le mode d'affichage (mois ou année)
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // État pour le mois actuellement affiché
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialYear, new Date().getMonth(), 1)
  );

  // État pour la semaine sélectionnée
  const [selectedWeek, setSelectedWeek] = useState<WeekSchedule | null>(null);

  // Notifier le parent des changements
  useEffect(() => {
    onScheduleChange?.(scheduleData);
  }, [scheduleData, onScheduleChange]);

  // Fonction pour naviguer vers l'année précédente
  const goToPreviousYear = () => {
    if (selectedYear > minYear) {
      const prevYear = availableYears[availableYears.indexOf(selectedYear) - 1];
      if (prevYear) {
        setSelectedYear(prevYear);
        setCurrentMonth(new Date(prevYear, currentMonth.getMonth(), 1));
      }
    }
  };

  // Fonction pour naviguer vers l'année suivante
  const goToNextYear = () => {
    if (selectedYear < maxYear) {
      const nextYear = availableYears[availableYears.indexOf(selectedYear) + 1];
      if (nextYear) {
        setSelectedYear(nextYear);
        setCurrentMonth(new Date(nextYear, currentMonth.getMonth(), 1));
      }
    }
  };

  // Fonction pour naviguer vers le mois précédent
  const goToPreviousMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    const newMonthYear = getYear(newMonth);

    if (availableYears.includes(newMonthYear)) {
      setCurrentMonth(newMonth);

      // Si le mois change d'année, mettre à jour l'année sélectionnée
      if (newMonthYear !== selectedYear) {
        setSelectedYear(newMonthYear);
      }
    }
  };

  // Fonction pour naviguer vers le mois suivant
  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    const newMonthYear = getYear(newMonth);

    if (availableYears.includes(newMonthYear)) {
      setCurrentMonth(newMonth);

      // Si le mois change d'année, mettre à jour l'année sélectionnée
      if (newMonthYear !== selectedYear) {
        setSelectedYear(newMonthYear);
      }
    }
  };

  // Fonction pour mettre à jour l'option sélectionnée
  const handleOptionChange = (value: string, weekToUpdate: WeekSchedule) => {
    console.log(
      "handleOptionChange called with value:",
      value,
      "and week:",
      weekToUpdate
    );

    // Vérifiez si le type passe de NONE à un autre type
    if (weekToUpdate.type === "NONE" && value !== "NONE") {
      console.log(
        "Création de la semaine :",
        weekToUpdate.year,
        weekToUpdate.weekNumber,
        value
      );

      // Utilisez le hook useCreateWeek pour créer la semaine en BDD
      createWeek(
        {
          year: weekToUpdate.year,
          weekNumber: weekToUpdate.weekNumber,
          startDate: weekToUpdate.startDate,
          endDate: weekToUpdate.endDate,
          type: value as ScheduleOption,
        },
        {
          onSuccess: (response) => {
            console.log("createWeek onSuccess:", response);
            if (response.success) {
              const newScheduleData = scheduleData.map((week) =>
                week.weekNumber === weekToUpdate.weekNumber &&
                week.year === weekToUpdate.year
                  ? { ...week, type: value as ScheduleOption }
                  : week
              );
              setScheduleData(newScheduleData);

              if (
                selectedWeek &&
                selectedWeek.weekNumber === weekToUpdate.weekNumber &&
                selectedWeek.year === weekToUpdate.year
              ) {
                setSelectedWeek({
                  ...selectedWeek,
                  type: value as ScheduleOption,
                });
              }
            }
          },
          onError: (error) => {
            console.error("createWeek onError:", error);
          },
        }
      );
    }

    // Vérifiez si le type passe d'un type différent de NONE à un autre type différent de NONE ou du précédent type.
    if (
      weekToUpdate.type !== "NONE" &&
      value !== "NONE" &&
      value !== weekToUpdate.type
    ) {
      console.log(
        "Mise à jour de la semaine :",
        weekToUpdate.year,
        weekToUpdate.weekNumber,
        " depuis ",
        weekToUpdate.type,
        " vers : ",
        value
      );

      // Utilisez le hook useCreateWeek pour créer la semaine en BDD
      updateWeek(
        {
          startDate: weekToUpdate.startDate,
          previousType: weekToUpdate.type as ScheduleOption,
          type: value as ScheduleOption,
          places: weekToUpdate.places,
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              const newScheduleData = scheduleData.map((week) =>
                week.weekNumber === weekToUpdate.weekNumber &&
                week.year === weekToUpdate.year
                  ? { ...week, type: value as ScheduleOption }
                  : week
              );
              setScheduleData(newScheduleData);

              if (
                selectedWeek &&
                selectedWeek.weekNumber === weekToUpdate.weekNumber &&
                selectedWeek.year === weekToUpdate.year
              ) {
                setSelectedWeek({
                  ...selectedWeek,
                  type: value as ScheduleOption,
                });
              }
            }
          },
          onError: (error) => {
            console.error("createWeek onError:", error);
          },
        }
      );
    }

    if (weekToUpdate.type !== "NONE" && value === "NONE") {
      toast.error(
        "Vous ne pouvez pas supprimer un stage pour le moment, contactez l'administrateur."
      );
    }
  };

  // Formater les dates pour l'affichage
  const formatDateRange = (start: string, end: string) => {
    return `${format(new Date(start), "d MMMM", { locale: fr })} - ${format(
      new Date(end),
      "d MMMM yyyy",
      {
        locale: fr,
      }
    )}`;
  };

  // Obtenir les semaines selon le mode d'affichage
  const getFilteredWeeks = () => {
    return scheduleData
      .filter((week) => {
        const weekStartDate = parseISO(week.startDate);
        const weekEndDate = parseISO(week.endDate);

        // Filtrer par année sélectionnée
        if (week.year !== selectedYear) {
          return false;
        }

        // Si on est en vue mensuelle, filtrer uniquement les semaines du mois sélectionné
        if (viewMode === "month") {
          return (
            isSameMonth(weekStartDate, currentMonth) ||
            isSameMonth(weekEndDate, currentMonth)
          );
        }

        // En vue annuelle, inclure toutes les semaines de l'année sélectionnée
        return true;
      })
      .sort((a, b) => {
        // Trier par date de début
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
  };

  const filteredWeeks = getFilteredWeeks();

  // Vérifier si on est à la limite des années
  const isMinYear = selectedYear <= minYear;
  const isMaxYear = selectedYear >= maxYear;

  // Vérifier si on est à la limite des mois
  const isMinMonth =
    getYear(currentMonth) === minYear && currentMonth.getMonth() === 0;
  const isMaxMonth =
    getYear(currentMonth) === maxYear && currentMonth.getMonth() === 11;

  // Grouper les semaines par mois pour la vue annuelle
  const weeksByMonth = useMemo(() => {
    if (viewMode !== "year") return [];

    const months: { [key: number]: WeekSchedule[] } = {};

    filteredWeeks.forEach((week) => {
      const month = new Date(week.startDate).getMonth();
      if (!months[month]) {
        months[month] = [];
      }
      months[month].push(week);
    });

    return Object.entries(months).map(([month, weeks]) => ({
      month: Number.parseInt(month),
      weeks,
    }));
  }, [filteredWeeks, viewMode]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="iconXs"
              onClick={goToPreviousYear}
              disabled={isMinYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="font-normal">
              Planning {selectedYear}
            </CardTitle>
            <Button
              variant="outline"
              size="iconXs"
              onClick={goToNextYear}
              disabled={isMaxYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Tabs
            defaultValue="month"
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="month">
                <Calendar className="h-4 w-4 mr-2" />
                Mensuel
              </TabsTrigger>
              <TabsTrigger value="year">
                <CalendarDays className="h-4 w-4 mr-2" />
                Annuel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "month" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                disabled={isMinMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="text-xl font-medium capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </h3>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                disabled={isMaxMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {filteredWeeks.length > 0 ? (
                filteredWeeks.map((week) => {
                  const colors = optionColors[week.type];
                  return (
                    <Card
                      key={`${week.year}-${week.weekNumber}-${week.startDate}`}
                      className={cn(
                        "overflow-hidden border-l-4",
                        colors ? colors.border : ""
                      )}
                    >
                      <div
                        className={cn(
                          "p-4 flex justify-between items-center",
                          colors ? colors.bg : ""
                        )}
                      >
                        <div>
                          <h4
                            className={cn(
                              "font-medium",
                              colors ? colors.text : ""
                            )}
                          >
                            {formatDateRange(week.startDate, week.endDate)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Semaine {week.weekNumber}
                          </p>
                        </div>
                        <Select
                          value={week.type}
                          disabled={creationPending || updatePending}
                          onValueChange={(value) =>
                            handleOptionChange(value, week)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[180px]",
                              colors ? colors.selectBg : "",
                              colors ? colors.text : ""
                            )}
                          >
                            <SelectValue placeholder="Sélectionnez une option" />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  Aucune semaine pour ce mois
                </p>
              )}
            </div>
          </div>
        )}

        {viewMode === "year" && (
          <div className="grid gap-12 grid-cols-2">
            {weeksByMonth.length > 0 ? (
              weeksByMonth.map(({ month, weeks }) => (
                <div key={month} className="space-y-4">
                  <h3 className="text-xl font-medium capitalize">
                    {format(new Date(selectedYear, month, 1), "MMMM", {
                      locale: fr,
                    })}
                  </h3>
                  <div className="space-y-3">
                    {weeks.map((week) => {
                      const colors = optionColors[week.type];
                      return (
                        <Card
                          key={`${week.year}-${week.weekNumber}-${week.startDate}`}
                          className={cn(
                            "overflow-hidden border-l-4",
                            colors ? colors.border : ""
                          )}
                        >
                          <div
                            className={cn(
                              "p-4 flex flex-col lg:flex-row gap-2 justify-between items-center",
                              colors ? colors.bg : ""
                            )}
                          >
                            <div>
                              <h4
                                className={cn(
                                  "font-medium",
                                  colors ? colors.text : ""
                                )}
                              >
                                {formatDateRange(week.startDate, week.endDate)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Semaine {week.weekNumber}
                              </p>
                              {week.type !== "NONE" ? (
                                <Button variant={"default"} size={"sm"} asChild>
                                  <Link
                                    href={`/${pathname
                                      .split("/")
                                      .slice(1, 4)
                                      .join("/")}/stages/${week.id}`}
                                    className="mt-2"
                                  >
                                    Détails du stage
                                    <LucideExternalLink className="size-3" />
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                            <div className="flex flex-col gap-4">
                              <Select
                                value={week.type}
                                disabled={creationPending || updatePending}
                                onValueChange={(value) =>
                                  handleOptionChange(value, week)
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    "w-[180px]",
                                    colors ? colors.selectBg : "",
                                    colors ? colors.text : ""
                                  )}
                                >
                                  <SelectValue placeholder="Sélectionnez une option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {scheduleOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {week.type !== "NONE" ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs">
                                    {week.bookings.length} réservations sur{" "}
                                    {week.places}
                                  </span>
                                  <Progress
                                    value={
                                      (week.bookings.length / week.places) * 100
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Aucune semaine pour cette année
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
