"use client"; // This needs to be at the top to declare a client component

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getProfileRole } from "@/lib/actions/user.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/admin/dashboard-layout"; // Assuming Sidebar component is available
import { ProfileContextProvider, useProfile } from "@/contexts/profileContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const {role, setRole} = useProfile()
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  if (loading) {
    return (
      <section className="grid grid-cols-[1fr_4fr] gap-10 m-10">
        <Skeleton className="h-[800px] w-full rounded-lg" />
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </section>
    );
  }

  if (!role) {
    router.push("/");
    return null;
  }

  // Layout with Sidebar and Navbar
  return (
      <DashboardLayout>
        <main>{children}</main>
      </DashboardLayout>
  );
}
