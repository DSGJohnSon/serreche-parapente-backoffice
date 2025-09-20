"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, LucideFrown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateByAdminReservationStageSchema } from "../schemas";
import { useGetAllCustomers } from "@/features/customers/api/use-get-customers";
import { useGetAllStages } from "@/features/stages/api/use-get-stage";
import {
  SearchableSelect,
  SearchableSelectTrigger,
} from "@/components/ui/searchable-select";
import Link from "next/link";
import { StageBookingType, StageType } from "@prisma/client";
import { useCreateReservationStageByAdmin } from "../api/use-create-reservation-stage";

export default function ReservationStageAddForm() {
  const { data: customers, isLoading: customersLoading } = useGetAllCustomers();
  const { data: stages, isLoading: stagesLoading } = useGetAllStages();

  const { mutate, isPending } = useCreateReservationStageByAdmin();

  const form = useForm<z.infer<typeof CreateByAdminReservationStageSchema>>({
    resolver: zodResolver(CreateByAdminReservationStageSchema),
  });

  function onSubmit(values: z.infer<typeof CreateByAdminReservationStageSchema>) {
    mutate(values, {
      onSuccess: (data) => {
        form.reset();
      },
    });
  }

  if (customersLoading || stagesLoading) {
    return <div>Loading...</div>;
  }

  if (!customers || !stages) {
    return <div>No data available</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Client</FormLabel>
              <SearchableSelect
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.firstName} ${customer.lastName} (${customer.email})`,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}
                placeholder="Sélectionnez un client"
                clearable
              >
                {(provided) => <SearchableSelectTrigger {...provided} />}
              </SearchableSelect>
              <FormDescription>
                C&apos;est le client qui sera lié à cette réservation, pour créer un
                client, rendez-vous{" "}
                <Link href="/dashboard/add?type=customer" className="underline">
                  ici
                </Link>
                .
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Type de réservation</FormLabel>
              <SearchableSelect
                options={[
                  {
                    value: StageBookingType.AUTONOMIE,
                    label: "Autonomie",
                  },
                  {
                    value: StageBookingType.INITIATION,
                    label: "Initiation",
                  },
                  {
                    value: StageBookingType.PROGRESSION,
                    label: "Progression",
                  },
                ]}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Sélectionnez un type de réservation"
                disabled={isPending}
                clearable
              >
                {(provided) => <SearchableSelectTrigger {...provided} />}
              </SearchableSelect>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stageId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Stage</FormLabel>
              <SearchableSelect
                options={stages.map((stage) => {
                  const startDate = new Date(stage.startDate);
                  const endDate = new Date(startDate);
                  endDate.setDate(startDate.getDate() + stage.duration);

                  return {
                    value: stage.id,
                    label: `${startDate.getFullYear()} - Stage ${stage.type} - du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`,
                  };
                })}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Sélectionnez un stage"
                disabled={isPending}
                clearable
              >
                {(provided) => <SearchableSelectTrigger {...provided} />}
              </SearchableSelect>
              <FormDescription>
                Stage à sélectionner pour lier cette réservation, ils sont
                définis{" "}
                <Link href="/dashboard/planning" className="underline">
                  ici
                </Link>
                .
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          Enregistrer cette réservation
        </Button>
      </form>
    </Form>
  );
}
