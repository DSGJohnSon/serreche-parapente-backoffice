"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageAddForm } from "../forms/stage-add-form";
import { StageType } from "@prisma/client";

interface AddStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
  onCreateStage: (stage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurIds: string[];
    price: number;
    type: StageType;
  }) => void;
}

export function AddStageDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateStage,
}: AddStageDialogProps) {
  const handleSubmit = (stage: {
    startDate: Date;
    duration: number;
    places: number;
    moniteurIds: string[];
    price: number;
    type: StageType;
  }) => {
    onCreateStage(stage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau stage</DialogTitle>
        </DialogHeader>
        <StageAddForm
          selectedDate={selectedDate}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}