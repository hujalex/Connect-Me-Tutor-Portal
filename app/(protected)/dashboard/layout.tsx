"use client"; // This needs to be at the top to declare a client component

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getProfile, getProfileRole } from "@/lib/actions/user.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/admin/dashboard-layout"; // Assuming Sidebar component is available
import { ProfileContextProvider, useProfile } from "@/contexts/profileContext";
import { useFetchProfile } from "@/hooks/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile: fetchedData, loading: isLoading } = useFetchProfile();
  const { profile, setProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [queryClient] = useState(() => new QueryClient());


  useEffect(() => {
    console.log("Initial Profile Fetch");
    if (fetchedData) {
      setProfile(fetchedData);
      setLoading(isLoading);
    }
    // setProfile(fetchedProfile.profile)
  }, [fetchedData, isLoading, setProfile, setLoading]);

  if (loading) {
    return (
      <section className="grid grid-cols-[1fr_4fr] gap-10 m-10">
        <Skeleton className="h-[800px] w-full rounded-lg" />
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </section>
    );
  }

  if (!profile || !profile.role) {
    router.push("/");
    return null;
  }

  // Layout with Sidebar and Navbar
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <main>{children}</main>
      </DashboardLayout>
    </QueryClientProvider>
  );
}
