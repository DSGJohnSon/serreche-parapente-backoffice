"use client";

import * as React from "react";

import { NavUser } from "@/components/sidebar/user/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { User } from "@prisma/client";
import { NavMain } from "./nav-main";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LucideHouse } from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const slugToKnowIfActive = pathname.split("/").slice(2, 3);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuItem>
          <Link href={`/dashboard`}>
            <SidebarMenuButton tooltip={"Planning"}>
              <div className="flex h-8 w-8 items-center justify-center bg-slate-900 dark:bg-white p-1 rounded-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:scale-[200%] group-data-[collapsible=icon]:p-0">
                <Image
                  src={"/logo-light-nobg.webp"}
                  alt="Logo Serre Chevalier Parapente"
                  className="dark:invert "
                  width={48}
                  height={48}
                />
              </div>
              <span className="flex items-center gap-2 font-medium group-data-[collapsible=icon]:hidden">
                Serre Chevalier Parapente
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarSeparator className="border-b" />
      <SidebarContent className="flex flex-col h-full justify-content">
        <NavMain role={user.role} />
      </SidebarContent>
      <SidebarSeparator className="border-b" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
