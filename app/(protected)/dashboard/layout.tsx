'use client'; // This needs to be at the top to declare a client component

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getProfileRole } from '@/lib/actions/user.actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/admin/dashboard-layout'; // Assuming Sidebar component is available

export default function Layout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUserProfileRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const profileRole = await getProfileRole(user.id);
          if (profileRole) {
            setRole(profileRole);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfileRole();
  }, [supabase.auth]);

  if (loading) {
    return (
      <section className="grid grid-cols-[1fr_4fr] gap-10 m-10">
        <Skeleton className="h-[800px] w-full rounded-lg" />
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </section>
    );
  }

  if (!role) {
    router.push('/');
    return null;
  }

  // Layout with Sidebar and Navbar
  return (
    <DashboardLayout>
      <main>
        {children}
      </main>
    </DashboardLayout>
  );
}
