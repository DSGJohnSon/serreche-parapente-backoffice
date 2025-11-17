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
  LucideShoppingCart,
  LucideUsers2,
  LucideUsersRound,
  LucideUserCheck,
  LucideCreditCard,
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
              slugToKnowIfActive[0] === "commandes"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/commandes`}
            >
              <SidebarMenuButton tooltip={"Commandes"}>
                <LucideShoppingCart className="size-4" />
                <span>Commandes</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "paiements"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/paiements`}
            >
              <SidebarMenuButton tooltip={"Paiements"}>
                <LucideCreditCard className="size-4" />
                <span>Paiements</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "clients"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/clients`}
            >
              <SidebarMenuButton tooltip={"Clients (Payeurs)"}>
                <LucideUsers2 className="size-4" />
                <span>Clients</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition",
              slugToKnowIfActive[0] === "stagiaires"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link
              href={`/${pathname.split("/").slice(1, 2).join("/")}/stagiaires`}
            >
              <SidebarMenuButton tooltip={"Stagiaires (Participants)"}>
                <LucideUserCheck className="size-4" />
                <span>Stagiaires</span>
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
              href={`/${pathname
                .split("/")
                .slice(1, 2)
                .join("/")}/bons-cadeaux`}
            >
              <SidebarMenuButton tooltip={"Clients"}>
                <LucideGift className="size-4" />
                <span>Bons Cadeaux</span>
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
              slugToKnowIfActive[0] === "tarifs"
                ? "bg-foreground/5 dark:bg-white dark:text-black hover:dark:bg-white"
                : ""
            )}
          >
            <Link href={`/${pathname.split("/").slice(1, 2).join("/")}/tarifs`}>
              <SidebarMenuButton tooltip={"Tarifs"}>
                <LucideEuro className="size-4" />
                <span>Tarifs</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem
            className={cn(
              "hover:bg-foreground/5 hover:dark:bg-foreground/10 rounded-md transition group/external-link",
              
            )}
          >
            <Link href={`https://www.sanity.io/@o3ZClfzZI/studio/b8mm7m4emqxwjg4ztwkvcvmv/default/studio/structure`} target="_blank">
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
