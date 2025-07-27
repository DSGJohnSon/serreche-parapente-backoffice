"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { useUpdateStage } from "@/features/stages/api/use-update-stages";
import { UpdateStageSchema } from "@/features/stages/schemas";
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

interface StageData {
  startDate: string;
  type: StageType;
  places?: number;
}

interface StageEditFormProps {
  stage: StageData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StageEditForm({
  stage,
  onSuccess,
  onCancel,
}: StageEditFormProps) {
  const updateStage = useUpdateStage();
  const [showCalendar, setShowCalendar] = useState(false);

  const form = useForm<z.infer<typeof UpdateStageSchema>>({
    resolver: zodResolver(UpdateStageSchema),
    defaultValues: {
      startDate: stage.startDate,
      previousType: stage.type,
      type: stage.type,
      places: stage.places || 10,
    },
  });

  useEffect(() => {
    if (stage) {
      form.reset({
        startDate: stage.startDate,
        previousType: stage.type,
        type: stage.type,
        places: stage.places || 10,
      });
    }
  }, [stage, form]);

  const handleSubmit = async (values: z.infer<typeof UpdateStageSchema>) => {
    try {
      await updateStage.mutateAsync(values);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stage:", error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("startDate", date.toISOString());
      setShowCalendar(false);
    }
  };

  const startDateValue = form.watch("startDate");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début</FormLabel>
              <FormControl>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent"
                      disabled={updateStage.isPending}
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
                      onSelect={handleDateSelect}
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
                  disabled={updateStage.isPending}
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

        <FormField
          control={form.control}
          name="places"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de places</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={updateStage.isPending}
                />
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
              disabled={updateStage.isPending}
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={updateStage.isPending}
            className="flex-1"
          >
            {updateStage.isPending ? "Modification..." : "Modifier le stage"}
          </Button>
        </div>
      </form>
    </Form>
  );
}