"use client";

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
import { set } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function AddFloatingButton({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="fixed right-6 bottom-6" asChild>
        <Button size={"icon"} className={className}>
          <LucidePlus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ajouter une instance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href={"/dashboard/add?type=monitor"}
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            <LucideUserPlus className="h-4 w-4" />
            Moniteur
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href={"/dashboard/add?type=customer"}
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            <LucideUserPlus className="h-4 w-4" />
            Client
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href={"/dashboard/add?type=reservation-stage"}
            className="flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            <LucideBookmarkPlus className="h-4 w-4" />
            Réservation d&apos;un Stage
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddFloatingButton;
