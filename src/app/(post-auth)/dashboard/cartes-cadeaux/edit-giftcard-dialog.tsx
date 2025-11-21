"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GiftCardEditForm } from "@/features/giftcards/forms/giftcard-edit-form";

interface GiftCardData {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  customerId: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  createdAt: Date;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  usedByCustomer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface EditGiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftCard: GiftCardData | null;
}

export function EditGiftCardDialog({
  open,
  onOpenChange,
  giftCard,
}: EditGiftCardDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!giftCard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la Carte Cadeau</DialogTitle>
        </DialogHeader>

        <GiftCardEditForm
          giftCard={giftCard}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}