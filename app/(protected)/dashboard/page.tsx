// pages/dashboard.js
import { useEffect, useState } from 'react';
import { createClient } from '@/lib//supabase/client';
import { getProfileRole } from '@/lib//actions/user.actions'; // Import the function
import StudentDashboard from '@/components/student/DashboardContent';
import TutorDashboard from '@/components/tutor/DashboardContent';
import AdminDashboard from '@/components/admin/DashboardContent';

const Dashboard = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserProfileRole = async () => {
    const supabase = createClient()
      const user = supabase.auth.user();
      if (user) {
        const profileRole = await getProfileRole(user.id); // Call the function
        if (profileRole) {
            setRole(profileRole);
        }
      }
      setLoading(false);
    };

    getUserProfileRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (role === 'student') {
    return <StudentDashboard />;
  } else if (role === 'tutor') {
    return <TutorDashboard />;
  } else if (role === 'admin') {
    return <AdminDashboard />;
  } else {
    return <div>No role found</div>;
  }
};

export default Dashboard;
