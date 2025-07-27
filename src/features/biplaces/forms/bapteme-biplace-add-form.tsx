"use client";

import type React from "react";
import { useState } from "react";
import { BaptemeAddForm } from "./bapteme-add-form";
import { useCreateBapteme } from "@/features/biplaces/api/use-create-bapteme";
import { Bapteme } from "@prisma/client";

interface BaptemeBiPlaceAddFormProps {
  onSuccess?: () => void;
}

export function BaptemeBiPlaceAddForm({
  onSuccess,
}: BaptemeBiPlaceAddFormProps) {
  const createBapteme = useCreateBapteme();

  const handleSubmit = async (baptemeData: Omit<Bapteme, "id">) => {
    try {
      // Convert to the format expected by the API
      const apiData = {
        date: baptemeData.date.toISOString(),
        duration: baptemeData.duration,
        places: baptemeData.places,
        moniteurId: baptemeData.moniteurId,
        price: baptemeData.price,
      };

      await createBapteme.mutateAsync(apiData);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création du baptême:", error);
    }
  };

  return (
    <BaptemeAddForm
      onSubmit={handleSubmit}
    />
  );
}

export default BaptemeBiPlaceAddForm;