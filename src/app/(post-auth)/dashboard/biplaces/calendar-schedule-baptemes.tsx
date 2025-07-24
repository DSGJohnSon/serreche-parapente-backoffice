"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Bapteme } from "@prisma/client";

interface BaptemeCalendarProps {
  baptemes: Bapteme[];
  onBaptemeClick: (bapteme: Bapteme) => void;
  onDayClick: (date: Date) => void;
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
  const [selectedBapteme, setSelectedBapteme] = useState<Bapteme | null>(null);

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

  const handleBaptemeClick = (bapteme: Bapteme) => {
    setSelectedBapteme(bapteme);
    onBaptemeClick(bapteme);
  };

  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({ start, end });
    const hours = Array.from({ length: 24 }, (_, i) => i);

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
              className={`p-2 text-center border-l cursor-pointer hover:bg-muted/50 ${
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
          <div className="grid grid-cols-8">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="p-2 text-xs text-muted-foreground border-b border-r">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const dayBaptemes = getBaptemesForDay(day).filter(
                    (bapteme) => {
                      const baptemeHour = new Date(bapteme.date).getHours();
                      return baptemeHour === hour;
                    }
                  );

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="min-h-[60px] border-b border-l p-1 cursor-pointer hover:bg-muted/30"
                      onClick={() =>
                        onDayClick(
                          new Date(
                            day.getFullYear(),
                            day.getMonth(),
                            day.getDate(),
                            hour
                          )
                        )
                      }
                    >
                      {dayBaptemes.map((bapteme) => (
                        <div
                          key={bapteme.id}
                          className="mb-1 p-1 bg-primary/20 rounded text-xs cursor-pointer hover:bg-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBaptemeClick(bapteme);
                          }}
                        >
                          <div className="font-medium">
                            {formatTime(new Date(bapteme.date))} -{" "}
                            {formatTime(getEndTime(bapteme))}
                          </div>
                          <div className="text-muted-foreground">
                            {bapteme.places} places
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
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
                        handleBaptemeClick(bapteme);
                      }}
                    >
                      {formatTime(new Date(bapteme.date))} -{" "}
                      {formatTime(getEndTime(bapteme))}
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
          <h1 className="text-2xl font-bold">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h1>
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

      {/* Bapteme details dialog */}
      <Dialog
        open={!!selectedBapteme}
        onOpenChange={() => setSelectedBapteme(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du Baptême</DialogTitle>
          </DialogHeader>
          {selectedBapteme && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date et heure
                </label>
                <p className="text-lg">
                  {format(
                    new Date(selectedBapteme.date),
                    "EEEE d MMMM yyyy à HH:mm",
                    { locale: fr }
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Durée
                </label>
                <p>{selectedBapteme.duration} minutes</p>
                <p className="text-sm text-muted-foreground">
                  Fin prévue: {formatTime(getEndTime(selectedBapteme))}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Places disponibles
                </label>
                <p>{selectedBapteme.places} places</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Moniteur
                </label>
                <p>{selectedBapteme.moniteurId}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBapteme.moniteurId}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
