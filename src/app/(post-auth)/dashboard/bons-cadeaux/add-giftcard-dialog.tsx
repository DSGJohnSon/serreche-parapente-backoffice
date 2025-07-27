"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GiftCardAddForm } from "@/features/giftcards/forms/giftcard-add-form";

interface AddGiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGiftCardDialog({
  open,
  onOpenChange,
}: AddGiftCardDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un Bon Cadeau</DialogTitle>
        </DialogHeader>

        <GiftCardAddForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}