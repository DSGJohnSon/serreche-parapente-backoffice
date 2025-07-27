"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCreateStage } from "@/features/stages/api/use-create-stage";
import { CreateStageSchema } from "@/features/stages/schemas";
import { StageType } from "@prisma/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StageAddFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StageAddForm({
  onSuccess,
  onCancel,
}: StageAddFormProps) {
  const createStage = useCreateStage();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const form = useForm<z.infer<typeof CreateStageSchema>>({
    resolver: zodResolver(CreateStageSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      weekNumber: 1,
      startDate: "",
      endDate: "",
      type: StageType.INITIATION,
    },
  });

  const handleSubmit = async (values: z.infer<typeof CreateStageSchema>) => {
    try {
      await createStage.mutateAsync(values);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création du stage:", error);
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("startDate", date.toISOString());
      setShowStartCalendar(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("endDate", date.toISOString());
      setShowEndCalendar(false);
    }
  };

  const startDateValue = form.watch("startDate");
  const endDateValue = form.watch("endDate");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Année</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2000"
                    max="2200"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={createStage.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weekNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de semaine</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="53"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={createStage.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début</FormLabel>
              <FormControl>
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent"
                      disabled={createStage.isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateValue ? 
                        format(new Date(startDateValue), "EEEE d MMMM yyyy", { locale: fr }) :
                        "Sélectionner une date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateValue ? new Date(startDateValue) : undefined}
                      onSelect={handleStartDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de fin</FormLabel>
              <FormControl>
                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent"
                      disabled={createStage.isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateValue ? 
                        format(new Date(endDateValue), "EEEE d MMMM yyyy", { locale: fr }) :
                        "Sélectionner une date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateValue ? new Date(endDateValue) : undefined}
                      onSelect={handleEndDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de stage</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={createStage.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StageType.NONE}>Aucun</SelectItem>
                    <SelectItem value={StageType.INITIATION}>Initiation</SelectItem>
                    <SelectItem value={StageType.PROGRESSION}>Progression</SelectItem>
                    <SelectItem value={StageType.DOUBLE}>Double</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createStage.isPending}
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createStage.isPending}
            className="flex-1"
          >
            {createStage.isPending ? "Création..." : "Créer le stage"}
          </Button>
        </div>
      </form>
    </Form>
  );
}