"use client";

import { useCreateCustomerModal } from "@/features/customers/store/use-create-customer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  LucideBookmarkPlus,
  LucideGraduationCap,
  LucidePlus,
  LucideUserPlus,
} from "lucide-react";
import { useAddMonitorModal } from "@/features/users/store/use-add-monitor";

function AddFloatingButton({ className }: { className?: string }) {
  const [openCreateCustomer, setOpenCreateCustomer] = useCreateCustomerModal();
  const [openAddMonitor, setOpenAddMonitor] = useAddMonitorModal();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="fixed right-6 bottom-6" asChild>
        <Button size={"icon"} className={className}>
          <LucidePlus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ajouter une instance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setOpenAddMonitor(true)}
        >
          <LucideGraduationCap className="h-4 w-4" />
          Moniteur
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setOpenCreateCustomer(true)}
        >
          <LucideUserPlus className="h-4 w-4" />
          Client
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <LucideBookmarkPlus className="h-4 w-4" />
          Réservation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddFloatingButton;
