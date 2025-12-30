import EnrollmentsManager from "@/components/admin/EnrollmentsManagement";
import { getAllEnrollments } from "@/lib/actions/enrollment.server.actions";
import { getMeetings } from "@/lib/actions/meeting.server.actions";
import { getAllProfiles } from "@/lib/actions/profile.server.actions";

export default async function MyStudentsPage() {
  const [enrollments, meetings, students, tutors] = await Promise.all([
    getAllEnrollments(),
    getMeetings(),
    getAllProfiles("Student").then((s) =>
      s ? s.filter((s) => s.status === "Active") : null
    ),
    getAllProfiles("Tutor").then((s) =>
      s ? s.filter((s) => s.status === "Active") : null
    ),
  ]);

  return (
    <main>
      <EnrollmentsManager
        initialEnrollments={enrollments}
        initialMeetings={meetings}
        initialStudents={students}
        initialTutors={tutors}
      />
    </main>
  );
}
