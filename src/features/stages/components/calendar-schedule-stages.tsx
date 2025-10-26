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
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

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

  const getStagesStartingOnDay = (date: Date) => {
    return stages.filter((stage) =>
      isSameDay(new Date(stage.startDate), date)
    );
  };

  // Get stages that continue from previous week
  const getStagesContinuingOnDay = (date: Date, weekStartDate: Date) => {
    return stages.filter((stage) => {
      const stageStart = new Date(stage.startDate);
      // duration is in days, so a 7-day stage goes from day 0 to day 6
      const stageEnd = addDays(stageStart, stage.duration - 1);
      
      // Stage started before this week and continues into/through this week
      return stageStart < weekStartDate &&
             stageEnd >= date &&
             isSameDay(date, weekStartDate); // Only show on first day of week
    });
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

  const getTypeRingColor = (type: string) => {
    switch (type) {
      case "INITIATION":
        return "ring-blue-500";
      case "PROGRESSION":
        return "ring-green-500";
      case "AUTONOMIE":
        return "ring-purple-500";
      case "DOUBLE":
        return "ring-orange-500";
      default:
        return "ring-gray-500";
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
              className={`p-4 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50 ${
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
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, dayIndex) => {
            const dayStages = getStagesStartingOnDay(day);
            const continuingStages = dayIndex === 0 ? getStagesContinuingOnDay(day, weekDays[0]) : [];
            const allStages = [...continuingStages, ...dayStages];
            
            return (
              <div
                key={day.toISOString()}
                className="border-r last:border-r-0 border-b p-2 cursor-pointer hover:bg-muted/30 min-h-[400px] relative overflow-visible"
                onClick={() => onDayClick(day)}
              >
                {/* Stages starting on this day or continuing from previous week */}
                <div className="space-y-1">
                  {allStages.map((stage, stageIndex) => {
                    const stageStart = new Date(stage.startDate);
                    const stageEnd = addDays(stageStart, stage.duration - 1);
                    const isContinuing = stageStart < weekDays[0];
                    
                    // Calculate how many days this stage spans in this week
                    let spanDays;
                    if (isContinuing) {
                      // Stage continues from previous week
                      // stageEnd is already calculated as startDate + duration - 1
                      // So we need to count from today to stageEnd inclusive
                      const daysFromTodayToEnd = Math.floor((stageEnd.getTime() - day.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      spanDays = Math.min(daysFromTodayToEnd, 7);
                    } else {
                      // Stage starts this week
                      const remainingDaysInWeek = 7 - dayIndex;
                      spanDays = Math.min(stage.duration, remainingDaysInWeek);
                    }
                    
                    return (
                      <div
                        key={stage.id}
                        className={`relative pointer-events-auto cursor-pointer border rounded-md p-2 text-xs ${getTypeColor(stage.type)} transition-all ${
                          hoveredStageId === stage.id ? `ring-2 ${getTypeRingColor(stage.type)} shadow-lg` : 'border-2'
                        }`}
                        style={{
                          width: `calc(${spanDays * 100}% + ${(spanDays - 1) * 0.5}px)`,
                          zIndex: hoveredStageId === stage.id ? 50 : 10 + stageIndex
                        }}
                        onMouseEnter={() => setHoveredStageId(stage.id)}
                        onMouseLeave={() => setHoveredStageId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageClick(stage);
                        }}
                      >
                        <div className="font-semibold truncate">
                          {isContinuing && "↪ "}
                          {getTypeLabel(stage.type)}
                        </div>
                        <div className="opacity-80 truncate">
                          {stage.moniteurs?.length > 0
                            ? stage.moniteurs.length === 1
                              ? stage.moniteurs[0].moniteur.name
                              : `${stage.moniteurs[0].moniteur.name} +${stage.moniteurs.length - 1}`
                            : 'Aucun moniteur'
                          }
                        </div>
                        <div className="opacity-80">
                          <span className="font-bold">{stage.placesRestantes || 0} places restantes</span> • {stage.bookings?.length || 0} réservations • {stage.duration}j
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
    
    // Group calendar days by week
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

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

        {/* Month grid - week by week */}
        <div className="flex-1 flex flex-col">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex-1 grid grid-cols-7">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayStages = getStagesStartingOnDay(day);
                const continuingStages = dayIndex === 0 ? getStagesContinuingOnDay(day, week[0]) : [];
                const allStages = [...continuingStages, ...dayStages];
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r last:border-r-0 border-b p-2 cursor-pointer hover:bg-muted/50 min-h-[100px] relative overflow-visible ${
                      !isCurrentMonth ? "text-muted-foreground bg-muted/20" : ""
                    } ${isToday(day) ? "bg-primary/10" : ""}`}
                    onClick={() => onDayClick(day)}
                  >
                    <div
                      className={`text-sm mb-1 font-medium ${
                        isToday(day) ? "font-bold text-primary" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    
                    {/* Stages starting on this day or continuing from previous week */}
                    <div className="space-y-1 mt-1">
                      {allStages.map((stage, stageIndex) => {
                        const stageStart = new Date(stage.startDate);
                        const stageEnd = addDays(stageStart, stage.duration - 1);
                        const isContinuing = stageStart < week[0];
                        
                        // Calculate how many days this stage spans in this week
                        let spanDays;
                        if (isContinuing) {
                          // Stage continues from previous week
                          // stageEnd is already calculated as startDate + duration - 1
                          // So we need to count from today to stageEnd inclusive
                          const daysFromTodayToEnd = Math.floor((stageEnd.getTime() - day.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          spanDays = Math.min(daysFromTodayToEnd, 7);
                        } else {
                          // Stage starts this week
                          const remainingDaysInWeek = 7 - dayIndex;
                          spanDays = Math.min(stage.duration, remainingDaysInWeek);
                        }
                        
                        return (
                          <div
                            key={`${stage.id}-${weekIndex}`}
                            className={`relative pointer-events-auto cursor-pointer border rounded-sm px-1 py-0.5 text-xs ${getTypeColor(stage.type)} transition-all ${
                              hoveredStageId === stage.id ? `ring-2 ${getTypeRingColor(stage.type)} shadow-lg` : 'border'
                            }`}
                            style={{
                              width: `calc(${spanDays * 100}% + ${(spanDays - 1) * 0.5}px)`,
                              zIndex: hoveredStageId === stage.id ? 50 : 10 + stageIndex
                            }}
                            onMouseEnter={() => setHoveredStageId(stage.id)}
                            onMouseLeave={() => setHoveredStageId(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStageClick(stage);
                            }}
                          >
                            <div className="font-semibold truncate leading-tight">
                              {isContinuing && "↪ "}
                              {stage.type === "INITIATION" && "Initiation"}
                              {stage.type === "PROGRESSION" && "Progression"}
                              {stage.type === "AUTONOMIE" && "Autonomie"}
                              {stage.type === "DOUBLE" && "Double"}
                            </div>
                            <div className="text-[10px] opacity-80 truncate leading-tight">
                              <span className={`font-bold ${(stage.placesRestantes || 0) <= 2 ? 'text-red-600' : ''}`}>{stage.placesRestantes || 0} places restantes</span> • {stage.bookings?.length || 0} réservations • {stage.duration}j
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
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