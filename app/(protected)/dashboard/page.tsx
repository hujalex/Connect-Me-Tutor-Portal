import AdminDashboard from "@/components/admin/DashboardContent";
// import Dashboard from "@/components/dashboard/dashboard";
import StudentDashboard from "@/components/student/StudentDashboard";
import TutorDashboard from "@/components/tutor/dashboard";
import { getMeetings } from "@/lib/actions/meeting.server.actions";
import { cachedGetProfile } from "@/lib/actions/profile.server.actions";
import { getTutorSessions } from "@/lib/actions/session.server.actions";
import { cachedGetUser } from "@/lib/actions/user.server.actions";
import { endOfWeek, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";

async function getTutorSessionData() {}

export default async function DashboardPage() {
  const user = await cachedGetUser();
  if (!user) redirect("/");

  const profile = await cachedGetProfile(user.id);
  if (!profile) throw new Error("No Profile found");

  const currentSessionData = getTutorSessions(
    profile.id,
    startOfWeek(new Date()).toISOString(),
    endOfWeek(new Date()).toISOString(),
    undefined,
    "date",
    true
  );

  const activeSessionData = getTutorSessions(
    profile.id,
    undefined,
    undefined,
    "Active",
    "date",
    true
  );

  const pastSessionData = getTutorSessions(
    profile.id,
    undefined,
    undefined,
    ["Complete", "Cancelled"],
    "date",
    false
  );

  const meetings = getMeetings();

  return (
    <>
      {/* <Dashboard /> */}
      {profile.role === "Student" && (
        <StudentDashboard initialProfile={profile} />
      )}
      {profile.role === "Tutor" && (
        <TutorDashboard
          initialProfile={profile}
          currentSessionsPromise={currentSessionData}
          activeSessionsPromise={activeSessionData}
          pastSessionsPromise={pastSessionData}
          meetingsPromise={meetings}
        />
      )}
      {profile.role === "Admin" && <AdminDashboard />}
    </>
  );
}

// const Dashboard = () => {
//   const { profile, setProfile } = useProfile()
//   const router = useRouter();

//   console.log("Dashboard")

//   if (!profile || !profile.role) {
//     router.push('/login');
//     return null;
//   }

//   // Layout with Sidebar and Navbar
//   return (
//     <main>
//       {profile.role === 'Student' && <StudentDashboard/>}
//       {profile.role === 'Tutor' && <TutorDashboard />}
//       {profile.role === 'Admin' && <AdminDashboard />}
//     </main>
//   );
// };
