"use client";

import {
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideExternalLink,
  LucidePencilLine,
  LucideUsers2,
  LucideUsersRound,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NavAdmin() {
  const pathname = usePathname();
  const slugToKnowIfActive = pathname.split("/").slice(4, 5);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem
          className={cn(
            "hover:bg-foreground/5 rounded-md transition",
            slugToKnowIfActive[0] === "administrateurs" ? "bg-foreground/5" : ""
          )}
        >
          <Link
            href={`/${pathname
              .split("/")
              .slice(1, 4)
              .join("/")}/administrateurs`}
          >
            <SidebarMenuButton tooltip={"Administrateurs"}>
              <LucideUsersRound className="size-4" />
              <span>Administrateurs</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
