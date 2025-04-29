"use client";

import {
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideExternalLink,
  LucidePencilLine,
  LucideUsers2,
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

export function NavMain() {
  const pathname = usePathname();
  const slugToKnowIfActive = pathname.split("/").slice(4, 5);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem
          className={cn(
            "hover:bg-foreground/5 rounded-md transition",
            slugToKnowIfActive[0] === "planning" ? "bg-foreground/5" : ""
          )}
        >
          <Link href={`/${pathname.split("/").slice(1, 4).join("/")}/planning`}>
            <SidebarMenuButton tooltip={"Planning"}>
              <LucideCalendarDays className="size-4" />
              <span>Planning</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem
          className={cn(
            "hover:bg-foreground/5 rounded-md transition",
            slugToKnowIfActive[0] === "reservations" ? "bg-foreground/5" : ""
          )}
        >
          <Link
            href={`/${pathname.split("/").slice(1, 4).join("/")}/reservations`}
          >
            <SidebarMenuButton tooltip={"Réservations"}>
              <LucideCalendarCheck className="size-4" />
              <span>Réservations</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem
          className={cn(
            "hover:bg-foreground/5 rounded-md transition",
            slugToKnowIfActive[0] === "clients" ? "bg-foreground/5" : ""
          )}
        >
          <Link href={`/${pathname.split("/").slice(1, 4).join("/")}/clients`}>
            <SidebarMenuButton tooltip={"Clients"}>
              <LucideUsers2 className="size-4" />
              <span>Clients</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem
          className={cn(
            "hover:bg-foreground/5 rounded-md transition group/external-link",
            slugToKnowIfActive[0] === "blog" ? "bg-foreground/5" : ""
          )}
        >
          <Link href={`/${pathname.split("/").slice(1, 4).join("/")}/blog`}>
            <SidebarMenuButton tooltip={("Blog - External")} className="justify-between">
              <div className="flex items-center gap-2">
                <LucidePencilLine className="size-4" />
                <span>Blog</span>
              </div>
              <LucideExternalLink
                className={cn("transition opacity-0 group-hover/external-link:opacity-50")}
              />
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
