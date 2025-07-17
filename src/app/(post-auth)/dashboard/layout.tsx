import AddFloatingButton from "@/components/add-floating-button";
import { AppSidebar } from "@/components/sidebar/user/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getCurrent } from "@/features/auth/actions";
import { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export default async function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrent();
  if (user instanceof AuthError) return;
  if (!user) {
    redirect("/sign-in");
  }
  if (user?.role === "CUSTOMER") {
    redirect("/account");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="relative">
        {children}
        <AddFloatingButton className="fixed bottom-6 right-6" />
      </SidebarInset>
    </SidebarProvider>
  );
}
