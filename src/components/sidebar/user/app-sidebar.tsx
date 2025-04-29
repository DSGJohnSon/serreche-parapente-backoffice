"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

import { NavUser } from "@/components/sidebar/user/nav-user";
import { TeamSwitcher } from "@/features/companies/components/user/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useGetCompaniesByUserId } from "@/features/companies/api/use-get-companies";
import { User } from "@prisma/client";
import { NavMain } from "./nav-main";
import { NavAdmin } from "./nav-admin";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
  activeCompanyId: string;
}

export function AppSidebar({
  user,
  activeCompanyId,
  ...props
}: AppSidebarProps) {
  const { data: companies, isLoading: isLoadingCompanies } =
    useGetCompaniesByUserId(user.id);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {isLoadingCompanies || !companies || companies === null ? (
          <GalleryVerticalEnd className="size-8" />
        ) : (
          <TeamSwitcher
            companies={companies}
            activeCompanyId={activeCompanyId}
            isLoading={isLoadingCompanies}
          />
        )}
      </SidebarHeader>
      <SidebarSeparator className="border-b" />
      <SidebarContent className="flex flex-col h-full justify-content">
        <NavMain />
        <NavAdmin />
      </SidebarContent>
      <SidebarSeparator className="border-b" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
