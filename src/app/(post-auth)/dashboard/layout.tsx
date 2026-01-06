import { AppSidebar } from "@/components/sidebar/user/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Menu</h1>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
