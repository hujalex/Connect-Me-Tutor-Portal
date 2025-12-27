'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { getProfileRole } from '@/lib/actions/user.actions';
import ProfileDashboard from "@/components/student/ProfileDashboard"
import StudentDashboard from '@/components/student/StudentDashboard';
import TutorDashboard from '@/components/tutor/DashboardContent';
import AdminDashboard from '@/components/admin/DashboardContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ firstName: string; lastName: string } | null>(null); // For displaying profile data
  const [userData, setUserData] = useState<User | null>(null);
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
          setUserData(user)
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
    router.push('/login');
    return null;
  }

  // Layout with Sidebar and Navbar
  return (
    <main>
      {role === 'Student' && <StudentDashboard user={userData}/>}
      {/* {role == 'Student' && <ProfileDashboard />} */}
      {role === 'Tutor' && <TutorDashboard />}
      {role === 'Admin' && <AdminDashboard />}
    </main>
  );
};

export default Dashboard;
