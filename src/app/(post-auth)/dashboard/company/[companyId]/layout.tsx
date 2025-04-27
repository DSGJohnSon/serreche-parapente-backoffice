import { AppSidebar } from "@/components/sidebar/user/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getCurrent } from "@/features/auth/actions";
import { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export default async function DashboardClientLayout({
  params,
  children,
}: {
  params: Promise<{ companyId: string }>;
  children: React.ReactNode;
}) {
  const user = await getCurrent();
  if (user instanceof AuthError) return;
  if (!user) {
    redirect("/sign-in");
  }
  if (user.role === "ADMIN") return redirect("/");

  const { companyId: activeCompanyId } = await params;

  return (
    <SidebarProvider>
      <AppSidebar user={user} activeCompanyId={activeCompanyId} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
