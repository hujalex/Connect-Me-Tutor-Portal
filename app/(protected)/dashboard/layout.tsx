'use client'; // This needs to be at the top to declare a client component

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getProfileRole } from '@/lib/actions/user.actions';
import StudentDashboard from '@/components/student/DashboardContent';
import TutorDashboard from '@/components/tutor/DashboardContent';
import AdminDashboard from '@/components/admin/DashboardContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/dashboard-layout'; // Assuming Sidebar component is available

export default function Layout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ firstName: string; lastName: string } | null>(null); // For displaying profile data
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
          // Simulating getting profile information from somewhere
          setProfile({ firstName: 'John', lastName: 'Doe' });
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
