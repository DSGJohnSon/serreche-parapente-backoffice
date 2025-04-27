"use client";

import * as React from "react";
import { ChevronsUpDown, LucideGalleryVerticalEnd, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import UsersProfilesCount from "@/features/users/components/users-profiles-count";
import Flag from "react-world-flags";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CopyTextComponent from "@/components/copy-text-component";
import { useCreateCompanyModal } from "../../store/use-create-workspace-company";
import { CompanyTypeReturned } from "../../../../types";

export function TeamSwitcher({
  companies,
  activeCompanyId,
  isLoading,
}: {
  companies: CompanyTypeReturned[];
  activeCompanyId: string;
  isLoading: boolean;
}) {
  const { isMobile } = useSidebar();
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] =
    useCreateCompanyModal();
  const pathname = usePathname();
  const router = useRouter();
  const [activeCompany, setActiveCompany] = React.useState(
    companies.find((company) => company.id === activeCompanyId)
  );

  if (isLoading || !activeCompany) {
    return null;
  }

  const handleCompanyChange = (company: CompanyTypeReturned) => {
    setActiveCompany(company);

    const newPathname = pathname.replace(
      new RegExp(`/${activeCompany.id}`),
      `/${company.id}`
    );

    router.push(newPathname);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LucideGalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeCompany.name}
                </span>
                <span className="truncate text-xs">{activeCompany.siret}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Entreprise sélectionnée
            </DropdownMenuLabel>
            <ActiveCompanyDetails company={activeCompany} />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Changer d&apos;entreprise
            </DropdownMenuLabel>
            {companies.filter((company) => company.id !== activeCompanyId)
              .length < 1 ? (
              <div className="bg-foreground/5 rounded-md px-2 py-1 pb-1.5 m-2">
                <span className="text-xs text-muted-foreground text-center w-full">
                  Aucune autre entreprise.
                </span>
              </div>
            ) : (
              companies
                .filter((company) => company.id !== activeCompanyId)
                .map((company) => (
                  <DropdownMenuItem
                    key={company.name}
                    onClick={() => handleCompanyChange(company)}
                    className="gap-2 p-2 cursor-pointer">
                    <div className="flex size-7 items-center justify-center rounded-sm border">
                      <LucideGalleryVerticalEnd className="size-4 shrink-0" />
                    </div>
                    {company.name}
                  </DropdownMenuItem>
                ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const ActiveCompanyDetails = ({
  company,
}: {
  company: CompanyTypeReturned;
}) => {
  return (
    <div className="bg-foreground/5 rounded-md p-3 m-2">
      <p className="text-sm font-bold max-w-full">{company.name}</p>
      <div className="flex items-center my-1">
        <Flag
          code={company.country}
          height="16"
          className="rounded-full size-3"
        />
        <span className="text-xs ml-1 text-muted-foreground">SIRET/CODE</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-xs ml-1 truncate">
              {company.siret}
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-1">
                {company.siret}
                <CopyTextComponent text={company.siret} size={"sm"} />
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center my-1">
        <span className="text-xs ml-1 text-muted-foreground mr-1">Membres</span>
        <UsersProfilesCount users={company.users} />
      </div>
    </div>
  );
};
