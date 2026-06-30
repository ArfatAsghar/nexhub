import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/AppSidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar profile={profile} />
      {/* Main content area with left padding to account for fixed sidebar */}
      <div className="flex-1 min-w-0 lg:pl-[232px]">
        <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
