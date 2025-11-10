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
  addMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Bapteme, User, BaptemeBooking } from "@prisma/client";

interface BaptemeWithDetails extends Bapteme {
  moniteurs: Array<{
    moniteur: User;
  }>;
  bookings: BaptemeBooking[];
  placesRestantes: number;
}

interface BaptemeCalendarProps {
  baptemes: any[];
  onBaptemeClick: (bapteme: any) => void;
  onDayClick: (date: Date, hour?: number) => void;
  onAddBapteme: () => void;
}

type CalendarView = "week" | "month";

export function CalendarScheduleBaptemes({
  baptemes,
  onBaptemeClick,
  onDayClick,
  onAddBapteme,
}: BaptemeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");

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
  const days = eachDayOfInterval({ start, end });

  const getBaptemesForDay = (date: Date) => {
    return baptemes.filter((bapteme) =>
      isSameDay(new Date(bapteme.date), date)
    );
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const getEndTime = (bapteme: Bapteme) => {
    const startTime = new Date(bapteme.date);
    const endTime = addMinutes(startTime, bapteme.duration);
    return endTime;
  };

  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({ start, end });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const HOUR_HEIGHT = 60; // Height of each hour slot in pixels

    // Function to check if two baptemes overlap
    const baptemesOverlap = (bapteme1: Bapteme, bapteme2: Bapteme) => {
      const start1 = new Date(bapteme1.date);
      const end1 = addMinutes(start1, bapteme1.duration);
      const start2 = new Date(bapteme2.date);
      const end2 = addMinutes(start2, bapteme2.duration);

      return start1 < end2 && start2 < end1;
    };

    // Generate a consistent blue shade for each bapteme based on its ID
    const getBaptemeColor = (baptemeId: string, index: number) => {
      // Create a simple hash from the ID
      let hash = 0;
      for (let i = 0; i < baptemeId.length; i++) {
        hash = baptemeId.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Add index variation to ensure different colors even for similar IDs
      hash = hash + index * 137; // 137 is a prime number for better distribution

      // Generate blue variations (hue around 210-250, saturation 65-85%, lightness 45-65%)
      const hue = 210 + (Math.abs(hash) % 40); // 210-250 (wider range)
      const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
      const lightness = 45 + (Math.abs(hash >> 16) % 20); // 45-65%

      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // Calculate position, height, z-index and horizontal offset for each bapteme
    const getBaptemeStyle = (
      bapteme: Bapteme,
      dayBaptemes: Bapteme[],
      baptemeIndex: number
    ) => {
      const baptemeStart = new Date(bapteme.date);
      const baptemeEnd = addMinutes(baptemeStart, bapteme.duration);

      const startHour = baptemeStart.getHours();
      const startMinutes = baptemeStart.getMinutes();
      const durationInHours = bapteme.duration / 60;

      const topOffset =
        startHour * HOUR_HEIGHT + (startMinutes * HOUR_HEIGHT) / 60;
      const height = durationInHours * HOUR_HEIGHT;

      // Calculate z-index: use lower values to avoid dialog issues
      // Earlier baptemes have lower z-index (appear behind)
      const timeValue =
        baptemeStart.getHours() * 60 + baptemeStart.getMinutes();
      const zIndex = 1 + Math.floor(timeValue / 60); // 1-24 range

      // Calculate horizontal offset and width for overlapping baptemes
      let leftOffset = 4; // Default left margin
      let widthPercentage = 85; // Base width (85% to leave space for clicking)

      // Find overlapping baptemes (including those with same start time)
      const overlappingBaptemes = dayBaptemes.filter(
        (other) => other.id !== bapteme.id && baptemesOverlap(bapteme, other)
      );

      // Sort overlapping baptemes by start time, then by ID for consistency
      const sortedOverlapping = overlappingBaptemes.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA === timeB) {
          return a.id.localeCompare(b.id); // Consistent ordering for same time
        }
        return timeA - timeB;
      });

      // Find how many baptemes start before or at the same time as this one
      const baptemesBeforeOrSame = sortedOverlapping.filter((other) => {
        const otherTime = new Date(other.date).getTime();
        const currentTime = baptemeStart.getTime();
        return (
          otherTime < currentTime ||
          (otherTime === currentTime && other.id < bapteme.id)
        );
      });

      // Calculate offset and width based on position in the stack (up to 5 levels)
      const stackPosition = baptemesBeforeOrSame.length;
      const maxLevels = 5;

      if (stackPosition > 0) {
        // Each level: 12% offset to the right, 8% reduction in width
        const offsetPerLevel = 12; // 12% offset per level
        const widthReductionPerLevel = 8; // 8% width reduction per level

        const actualLevel = Math.min(stackPosition, maxLevels);
        const totalOffset = actualLevel * offsetPerLevel;
        const totalWidthReduction = actualLevel * widthReductionPerLevel;

        // Calculate left offset (convert percentage to approximate pixels)
        leftOffset = 4 + totalOffset * 0.01 * 100;

        // Calculate width: base width minus reduction, ensuring it stays within 85% boundary
        widthPercentage = Math.max(25, 85 - totalWidthReduction); // Minimum 25% width

        // Ensure the right edge doesn't exceed 85% of the container
        const rightEdgePercentage = totalOffset + widthPercentage;
        if (rightEdgePercentage > 85) {
          widthPercentage = 85 - totalOffset;
          widthPercentage = Math.max(15, widthPercentage); // Minimum 15% width
        }
      }

      return {
        position: "absolute" as const,
        top: `${topOffset}px`,
        height: `${height}px`,
        left: `${leftOffset}px`,
        width: `${widthPercentage}%`,
        zIndex: zIndex,
        backgroundColor: getBaptemeColor(bapteme.id, baptemeIndex),
      };
    };

    return (
      <div className="flex flex-col h-full">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-sm font-medium text-muted-foreground">
            Heure
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-l cursor-pointer hover:bg-muted/90 ${
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

        {/* Week grid */}
        <div className="flex-1 overflow-auto">
          <TooltipProvider>
            <div className="grid grid-cols-8 relative">
              {/* Hour labels and empty cells */}
              {hours.map((hour) => (
                <React.Fragment key={hour}>
                  <div
                    className="p-2 text-xs text-muted-foreground border-b border-r"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayName = format(day, "EEEE", { locale: fr });
                    const tooltipText = `Ajouter un baptême ${dayName} à ${hour
                      .toString()
                      .padStart(2, "0")}h`;

                    // Determine if this hour is in the grayed-out periods
                    const isNightEarly = hour >= 0 && hour < 6; // 00h-6h
                    const isNightLate = hour >= 20 && hour < 24; // 20h-00h
                    const isGrayedOut = isNightEarly || isNightLate;
                    
                    // Add thicker border at 6h and 20h boundaries
                    const isTopBoundary = hour === 6;
                    const isBottomBoundary = hour === 19;

                    return (
                      <Tooltip key={`${day.toISOString()}-${hour}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`border-b border-l cursor-pointer hover:bg-gray-300/50 relative ${
                              isGrayedOut ? 'bg-gray-300/10' : 'bg-white'
                            } ${
                              isTopBoundary ? 'border-t-[2px] border-t-foreground/30' : ''
                            } ${
                              isBottomBoundary ? 'border-b-[2px] border-b-foreground/30' : ''
                            }`}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            onClick={() => onDayClick(day, hour)}
                          >
                            {/* Only render baptemes on the first hour they appear */}
                            {hour === 0 &&
                              (() => {
                                const dayBaptemes = getBaptemesForDay(day);
                                return dayBaptemes.map((bapteme, index) => (
                                  <div
                                    key={bapteme.id}
                                    style={getBaptemeStyle(
                                      bapteme,
                                      dayBaptemes,
                                      index
                                    )}
                                    className="text-white rounded-md p-2 text-xs cursor-pointer hover:opacity-90 shadow-sm border border-white/20 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onBaptemeClick(bapteme);
                                    }}
                                  >
                                    <div className="font-medium text-white text-xs">
                                      {formatTime(new Date(bapteme.date))} -{" "}
                                      {formatTime(getEndTime(bapteme))}
                                    </div>
                                    <div className="text-white/90 text-xs font-medium">
                                      {bapteme.moniteurs?.length > 0
                                        ? bapteme.moniteurs.length === 1
                                          ? bapteme.moniteurs[0].moniteur.name
                                          : `${bapteme.moniteurs[0].moniteur.name} +${bapteme.moniteurs.length - 1}`
                                        : 'Aucun moniteur'
                                      }
                                    </div>
                                    <div className="text-white/80 text-xs">
                                      {bapteme.placesRestantes}/{bapteme.places}{" "}
                                      places
                                    </div>
                                  </div>
                                ));
                              })()}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltipText}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </TooltipProvider>
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
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {calendarDays.map((day) => {
            const dayBaptemes = getBaptemesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-muted/50 ${
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
                <div className="space-y-1">
                  {dayBaptemes.slice(0, 3).map((bapteme) => (
                    <div
                      key={bapteme.id}
                      className="text-xs p-1 bg-primary/20 rounded cursor-pointer hover:bg-primary/30 truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBaptemeClick(bapteme);
                      }}
                    >
                      <div className="font-medium">
                        {formatTime(new Date(bapteme.date))} -{" "}
                        {formatTime(getEndTime(bapteme))}
                      </div>
                      <div className="text-xs opacity-80">
                        {bapteme.moniteurs?.length > 0
                          ? bapteme.moniteurs.length === 1
                            ? bapteme.moniteurs[0].moniteur.name
                            : `${bapteme.moniteurs[0].moniteur.name} +${bapteme.moniteurs.length - 1}`
                          : 'Aucun moniteur'
                        } • {bapteme.placesRestantes}/{bapteme.places}
                      </div>
                    </div>
                  ))}
                  {dayBaptemes.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayBaptemes.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

          <Button onClick={onAddBapteme}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Baptême
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
