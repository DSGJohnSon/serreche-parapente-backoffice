"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StageAddForm } from "../forms/stage-add-form";
import { StageType } from "@prisma/client";

interface AddStageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
  onCreateStage: (stage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurId: string;
    price: number;
    type: StageType;
  }) => void;
}

export function AddStageSheet({
  open,
  onOpenChange,
  selectedDate,
  onCreateStage,
}: AddStageSheetProps) {
  const handleSubmit = (stage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurId: string;
    price: number;
    type: StageType;
  }) => {
    onCreateStage(stage);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Ajouter un nouveau stage</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <StageAddForm
            selectedDate={selectedDate}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}