import { cachedGetUser } from "@/lib/actions/user.server.actions";
import DashboardLayout from "@/components/admin/dashboard-layout";
import DashboardProviders from "./dashboardprovider";
import { cachedGetProfile } from "@/lib/actions/profile.server.actions";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await cachedGetUser().catch((error) => {
    console.error("Unable to get user session", error);
    redirect("/");
  });

  if (!user) redirect("/")

  const profile = await cachedGetProfile(user.id);

  if (!profile || !profile.role) {
    redirect("/");
  }

  return (
    <>
      <DashboardProviders initialProfile={profile}>
        {" "}
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardProviders>
    </>
  );
}
