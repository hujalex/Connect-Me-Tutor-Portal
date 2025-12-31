import EnrollmentsList from "@/components/tutor/EnrollmentsManagement";
import {
  cachedGetEnrollments,
  getEnrollments,
} from "@/lib/actions/enrollment.server.actions";
import { cachedGetUser } from "@/lib/actions/user.server.actions";
import {
  cachedGetProfile,
  getTutorStudents,
} from "@/lib/actions/profile.server.actions";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";
import { profile } from "console";
import { getMeetings } from "@/lib/actions/meeting.server.actions";
import { Suspense } from "react";
import { Calendar } from "lucide-react";

const fetchUserProfile = async () => {
  const user = await cachedGetUser();
  const profileData = await cachedGetProfile(user.id);
  if (!profileData) throw new Error("No profile found");
  return profileData;
};

const fetchEnrollments = async (profileData: Profile) => {
  const enrollmentsData = await cachedGetEnrollments(profileData.id);
  if (!enrollmentsData) throw new Error("No enrollments found");

  const sortedEnrollments = enrollmentsData.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  return sortedEnrollments;
};

async function MyEnrollmentsData() {
  const profileData = await fetchUserProfile();

  const [sortedEnrollments, meetings, students] = await Promise.all([
    fetchEnrollments(profileData),
    getMeetings(),
    getTutorStudents(profileData.id).then((s) =>
      s?.filter((s) => s.status === "Active")
    ),
  ]);
  return (
    <EnrollmentsList
      initialEnrollments={sortedEnrollments}
      initialProfile={profileData}
      initialMeetings={meetings}
      initialStudents={students}
    />
  );
}

export default async function MyEnrollmentsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Enrollments</h1>
      <Suspense
        fallback={
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 animate-spin mx-auto text-blue-500" />
            <p className="mt-4 text-gray-600">Loading enrollments...</p>
          </div>
        }
      >
        <MyEnrollmentsData />
      </Suspense>
    </main>
  );
}
