"use client";

import {
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideEuro,
  LucideExternalLink,
  LucideGift,
  LucideGraduationCap,
  LucideHouse,
  LucidePencilLine,
  LucideTicket,
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

export function NavMain() {
  const pathname = usePathname();
  //Variable qui vérifie que le pathnamle est bien : url_du_site/dashboard sans rien derrière
  const isDashboard = pathname === "/dashboard";
  const slugToKnowIfActive = pathname.split("/").slice(2, 3);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Général</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              isDashboard
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link href={`/dashboard`}>
              <SidebarMenuButton tooltip={"Planning"}>
                <LucideHouse className="size-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "stages"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link href={`/${pathname.split("/").slice(1, 2).join("/")}/stages`}>
              <SidebarMenuButton tooltip={"Planning Stages"}>
                <LucideCalendarDays className="size-4" />
                <span>Planning Stages</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "biplaces"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/biplaces`}
            >
              <SidebarMenuButton tooltip={"Planning BiPlaces"}>
                <LucideCalendarDays className="size-4" />
                <span>Planning BiPlaces</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Gestion</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "reservations"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname
                .split("/")
                .slice(1, 2)
                .join("/")}/reservations`}
            >
              <SidebarMenuButton tooltip={"Réservations"}>
                <LucideCalendarCheck className="size-4" />
                <span>Réservations</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "customers"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/customers`}
            >
              <SidebarMenuButton tooltip={"Clients"}>
                <LucideUsers2 className="size-4" />
                <span>Clients</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "bons-cadeaux"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/bons-cadeaux`}
            >
              <SidebarMenuButton tooltip={"Clients"}>
                <LucideGift className="size-4" />
                <span>Bons Cadeaux</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "promotions"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/promotions"`}
            >
              <SidebarMenuButton tooltip={"Clients"}>
                <LucideTicket className="size-4" />
                <span>Code Promo</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Contenu</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "reservations"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link href={`/${pathname.split("/").slice(1, 2).join("/")}/tarifs`}>
              <SidebarMenuButton tooltip={"Réservations"}>
                <LucideEuro className="size-4" />
                <span>Tarifs</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition group/external-link",
              slugToKnowIfActive[0] === "blog"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link href={`/${pathname.split("/").slice(1, 2).join("/")}/blog`}>
              <SidebarMenuButton
                tooltip={"Blog - External"}
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <LucidePencilLine className="size-4" />
                  <span>Blog</span>
                </div>
                <LucideExternalLink
                  className={cn(
                    "transition opacity-0 group-hover/external-link:opacity-50"
                  )}
                />
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {/* ADMIN */}
      <SidebarGroup>
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "administrators"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname
                .split("/")
                .slice(1, 2)
                .join("/")}/administrators`}
            >
              <SidebarMenuButton tooltip={"Administrateurs"}>
                <LucideUsersRound className="size-4" />
                <span>Administrateurs</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "monitors"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/monitors`}
            >
              <SidebarMenuButton tooltip={"Moniteurs"}>
                <LucideGraduationCap className="size-4" />
                <span>Moniteurs</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
