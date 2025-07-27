"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bapteme } from "@prisma/client";
import { BaptemeAddForm } from "@/features/biplaces/forms/bapteme-add-form";

interface AddBaptemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedHour?: number;
  onCreateBapteme: (bapteme: Omit<Bapteme, "id">) => void;
}

export function AddBaptemeDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedHour,
  onCreateBapteme,
}: AddBaptemeDialogProps) {
  const handleSubmit = (baptemeData: Omit<Bapteme, "id">) => {
    onCreateBapteme(baptemeData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau Baptême</DialogTitle>
        </DialogHeader>

        <BaptemeAddForm
          selectedDate={selectedDate}
          selectedHour={selectedHour}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
