import AdminDashboard from "@/components/admin/DashboardContent";
// import Dashboard from "@/components/dashboard/dashboard";
import StudentDashboard from "@/components/student/StudentDashboard";
import TutorDashboard from "@/components/tutor/dashboard";
import SkeletonTable from "@/components/ui/skeleton";
import { getMeetings } from "@/lib/actions/meeting.server.actions";
import {
  cachedGetProfile,
  getProfile,
} from "@/lib/actions/profile.server.actions";
import {
  getStudentSessions,
  getTutorSessions,
} from "@/lib/actions/session.server.actions";
import { cachedGetUser, getUser } from "@/lib/actions/user.server.actions";
import { Meeting, Profile } from "@/types";
import { endOfWeek, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { SurveySchedule } from "posthog-js";
import { Suspense } from "react";

async function TutorDashboardPage({
  profile,
  meetings,
}: {
  profile: Profile;
  meetings: Promise<Meeting[] | null>;
}) {
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

  return (
    <TutorDashboard
      key={profile.id}
      initialProfile={profile}
      currentSessionsPromise={currentSessionData}
      activeSessionsPromise={activeSessionData}
      pastSessionsPromise={pastSessionData}
      meetingsPromise={meetings}
    />
  );
}

async function StudentDashboardPage({
  profile,
  meetings,
}: {
  profile: Profile;
  meetings: Promise<Meeting[] | null>;
}) {
  const currentStudentSessions = getStudentSessions(
    profile.id,
    startOfWeek(new Date()).toISOString(),
    endOfWeek(new Date()).toISOString(),
    undefined,
    "date",
    false
  );

  const activeStudentSessions = getStudentSessions(
    profile.id,
    undefined,
    undefined,
    "Active",
    "date",
    false
  );

  const pastStudentSessions = getStudentSessions(
    profile.id,
    undefined,
    undefined,
    ["Complete", "Cancelled"],
    "date",
    false
  );
  
  return (
    <Suspense fallback={<SkeletonTable />}>
      <StudentDashboard
        key={profile.id}
        initialProfile={profile}
        currentSessionsPromise={currentStudentSessions}
        activeSessionsPromise={activeStudentSessions}
        pastSessionsPromise={pastStudentSessions}
        meetingsPromise={meetings}
      />
    </Suspense>
  );
}

export default async function DashboardPage() {
  const user = await cachedGetUser();
  if (!user) redirect("/");

  const profile = await cachedGetProfile(user.id);
  if (!profile) throw new Error("No Profile found");

  const meetings = getMeetings();

  return (
    <>
      {/* <Dashboard /> */}
      {profile.role === "Student" && (
        <StudentDashboardPage profile={profile} meetings={meetings} />
      )}
      {profile.role === "Tutor" && (
        <Suspense fallback={<SkeletonTable />}>
          <TutorDashboardPage profile={profile} meetings={meetings} />{" "}
        </Suspense>
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
