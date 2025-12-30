import EnrollmentsList from "@/components/tutor/EnrollmentsManagement";
import {
  cachedGetEnrollments,
  getEnrollments,
} from "@/lib/actions/enrollment.server.actions";
import { cachedGetUser } from "@/lib/actions/user.server.actions";
import { cachedGetProfile, getTutorStudents } from "@/lib/actions/profile.server.actions";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";
import { profile } from "console";
import { getMeetings } from "@/lib/actions/meeting.server.actions";

const fetchUserProfile = async () => {
  const res = await cachedGetUser();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) throw new Error("No user found");

  const profileData = await cachedGetProfile(res.data.user.id);
  if (!profileData) throw new Error("No profile found");
  return profileData
};

const fetchEnrollments = async (profileData: Profile) => {
  const enrollmentsData = await cachedGetEnrollments(profileData.id);
  if (!enrollmentsData) throw new Error("No enrollments found");

  const sortedEnrollments = enrollmentsData.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  return sortedEnrollments;
};

export default async function MyEnrollmentsPage() {
  const profileData = await fetchUserProfile()

  const [sortedEnrollments, meetings, students] = await Promise.all([
    fetchEnrollments(profileData),
    getMeetings(),
    getTutorStudents(profileData.id).then((s) => s?.filter((s) => s.status === 'Active'))
  ])

  return (
    <main>
      <EnrollmentsList
        initialEnrollments={sortedEnrollments}
        initialProfile={profileData}
        initialMeetings={meetings}
        initialStudents={students}
      />
    </main>
  );
}
