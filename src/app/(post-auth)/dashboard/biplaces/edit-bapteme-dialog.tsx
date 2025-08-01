"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BaptemeEditForm } from "@/features/biplaces/forms/bapteme-edit-form";

interface BaptemeData {
  id: string;
  date: Date;
  duration: number;
  places: number;
  moniteurId: string;
  price: number;
  monitor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  bookings?: any[];
}

interface EditBaptemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bapteme: BaptemeData | null;
}

export function EditBaptemeDialog({
  open,
  onOpenChange,
  bapteme,
}: EditBaptemeDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!bapteme) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le Baptême</DialogTitle>
        </DialogHeader>

        <BaptemeEditForm
          bapteme={bapteme}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
