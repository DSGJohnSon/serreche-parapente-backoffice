"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  addDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Stage, User, StageBooking } from "@prisma/client";

interface StageWithDetails extends Stage {
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: StageBooking[];
  placesRestantes: number;
}

interface StageCalendarProps {
  stages: any[];
  onStageClick: (stage: any) => void;
  onDayClick: (date: Date) => void;
  onAddStage: () => void;
}

type CalendarView = "week" | "month";

export function CalendarScheduleStages({
  stages,
  onStageClick,
  onDayClick,
  onAddStage,
}: StageCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigatePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getDateRange = () => {
    if (view === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  };

  const { start, end } = getDateRange();

  const getStagesForDay = (date: Date) => {
    return stages.filter((stage) => {
      const stageStart = new Date(stage.startDate);
      const stageEnd = addDays(stageStart, stage.duration - 1);
      return date >= stageStart && date <= stageEnd;
    });
  };

  const getStagesStartingOnDay = (date: Date) => {
    return stages.filter((stage) =>
      isSameDay(new Date(stage.startDate), date)
    );
  };

  // Fonction pour calculer la position et la largeur d'un stage qui s'étale sur plusieurs jours
  const getStageSpanInfo = (stage: any, currentDate: Date, viewDays: Date[]) => {
    const stageStart = new Date(stage.startDate);
    const stageEnd = addDays(stageStart, stage.duration - 1);
    
    // Trouver l'index du jour actuel dans la vue
    const currentDayIndex = viewDays.findIndex(day => isSameDay(day, currentDate));
    if (currentDayIndex === -1) return null;
    
    // Calculer combien de jours le stage s'étend dans cette vue
    const visibleStart = Math.max(0, viewDays.findIndex(day => isSameDay(day, stageStart)));
    const visibleEnd = Math.min(viewDays.length - 1, viewDays.findIndex(day => isSameDay(day, stageEnd)));
    
    if (visibleEnd === -1) return null;
    
    const spanDays = visibleEnd - visibleStart + 1;
    const isFirstDay = isSameDay(currentDate, stageStart) || (visibleStart === currentDayIndex);
    
    return {
      spanDays,
      isFirstDay,
      dayIndex: currentDayIndex,
      visibleStart,
      visibleEnd
    };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INITIATION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROGRESSION":
        return "bg-green-100 text-green-800 border-green-200";
      case "AUTONOMIE":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DOUBLE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INITIATION":
        return "Stage d'initiation";
      case "PROGRESSION":
        return "Stage de progression";
      case "AUTONOMIE":
        return "Stage d'autonomie";
      case "DOUBLE":
        return "Stage à double type (Initiation ou Progression)";
      default:
        return type;
    }
  };

  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({ start, end });

    return (
      <div className="flex flex-col h-full">
        {/* Week header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-4 text-center border-r cursor-pointer hover:bg-muted/50 ${
                isToday(day) ? "bg-primary/10 font-semibold" : ""
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="text-sm font-medium">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div className={`text-lg ${isToday(day) ? "text-primary" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Week content */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-7 h-full">
            {weekDays.map((day) => (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="border-r border-b p-2 cursor-pointer hover:bg-muted/30 min-h-[400px] relative"
                      onClick={() => onDayClick(day)}
                    >
                      {/* Placeholder pour maintenir la structure */}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ajouter un stage le {format(day, "EEEE d MMMM", { locale: fr })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* Stages qui s'étalent sur plusieurs jours */}
          <div className="absolute inset-0 pointer-events-none p-2">
            {stages.map((stage, stageIndex) => {
              const spanInfo = getStageSpanInfo(stage, new Date(stage.startDate), weekDays);
              if (!spanInfo || !spanInfo.isFirstDay) return null;
              
              const { spanDays, visibleStart } = spanInfo;
              const leftPercentage = (visibleStart / 7) * 100;
              const widthPercentage = (spanDays / 7) * 100;
              
              return (
                <div
                  key={stage.id}
                  className={`absolute pointer-events-auto cursor-pointer hover:opacity-80 border rounded-md p-4 ${getTypeColor(stage.type)} border-2`}
                  style={{
                    left: `${leftPercentage}%`,
                    width: `${widthPercentage}%`,
                    height: "100%",
                    top: `${8 + stageIndex * 60}px`,
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageClick(stage);
                  }}
                >
                  <div className="font-medium text-xs">
                    {getTypeLabel(stage.type)}
                  </div>
                  <div className="text-xs opacity-80">
                    {stage.moniteurs?.length > 0
                      ? stage.moniteurs.length === 1
                        ? stage.moniteurs[0].moniteur.name
                        : `${stage.moniteurs[0].moniteur.name} +${stage.moniteurs.length - 1}`
                      : 'Aucun moniteur'
                    }
                  </div>
                  <div className="text-xs opacity-80">
                    {stage.placesRestantes || 0}/{stage.places} • {stage.duration}j
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    // Get all days to display (including previous/next month days for complete weeks)
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    return (
      <div className="flex flex-col h-full">
        {/* Month header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-7 grid-rows-6 h-full">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-muted/50 min-h-[120px] ${
                    !isCurrentMonth ? "text-muted-foreground bg-muted/20" : ""
                  } ${isToday(day) ? "bg-primary/10" : ""}`}
                  onClick={() => onDayClick(day)}
                >
                  <div
                    className={`text-sm mb-1 ${
                      isToday(day) ? "font-bold text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Stages qui s'étalent sur plusieurs jours en vue mois */}
          <div className="absolute inset-0 pointer-events-none">
            {stages.map((stage, stageIndex) => {
              const stageStart = new Date(stage.startDate);
              const stageEnd = addDays(stageStart, stage.duration - 1);
              
              // Calculer les semaines où le stage apparaît
              const stageWeeks: { week: number; startDay: number; endDay: number }[] = [];
              let currentWeekStart = startOfWeek(stageStart, { weekStartsOn: 1 });
              
              while (currentWeekStart <= stageEnd) {
                const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
                const weekStartDay = Math.max(0, Math.floor((Math.max(stageStart.getTime(), currentWeekStart.getTime()) - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)));
                const weekEndDay = Math.min(6, Math.floor((Math.min(stageEnd.getTime(), weekEnd.getTime()) - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24)));
                
                // Trouver l'index de la semaine dans le calendrier
                const weekIndex = calendarDays.findIndex(day => isSameDay(day, currentWeekStart));
                if (weekIndex !== -1) {
                  const weekNumber = Math.floor(weekIndex / 7);
                  stageWeeks.push({
                    week: weekNumber,
                    startDay: weekStartDay,
                    endDay: weekEndDay
                  });
                }
                
                currentWeekStart = addWeeks(currentWeekStart, 1);
              }
              
              return stageWeeks.map((weekInfo, weekIndex) => {
                const spanDays = weekInfo.endDay - weekInfo.startDay + 1;
                const leftPercentage = (weekInfo.startDay / 7) * 100;
                const widthPercentage = (spanDays / 7) * 100;
                const topPercentage = (weekInfo.week / 6) * 100;
                
                return (
                  <div
                    key={`${stage.id}-week-${weekInfo.week}`}
                    className={`absolute pointer-events-auto cursor-pointer hover:opacity-80 border rounded-sm p-1 ${getTypeColor(stage.type)} border-2`}
                    style={{
                      left: `${leftPercentage}%`,
                      width: `${widthPercentage}%`,
                      top: `calc(${topPercentage}% + ${35 + stageIndex * 25}px)`,
                      height: '22px',
                      zIndex: 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageClick(stage);
                    }}
                  >
                    <div className="font-medium text-xs truncate">
                      {weekIndex === 0 && getTypeLabel(stage.type)}
                      {weekIndex === 0 && weekInfo.startDay === Math.floor((stageStart.getTime() - startOfWeek(stageStart, { weekStartsOn: 1 }).getTime()) / (1000 * 60 * 60 * 24)) && " 🚀"}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Aujourd&apos;hui
            </Button>
          </div>
          <h1 className="text-2xl font-bold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Select
            value={view}
            onValueChange={(value: CalendarView) => setView(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onAddStage}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Stage
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {view === "week" ? renderWeekView() : renderMonthView()}
      </div>
    </div>
  );
}