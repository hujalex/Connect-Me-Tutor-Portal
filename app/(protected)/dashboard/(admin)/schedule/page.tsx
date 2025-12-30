import ScheduleManagement from "@/components/admin/ScheduleManagement";
import { getAllActiveEnrollments } from "@/lib/actions/enrollment.server.actions";
import { getMeetings } from "@/lib/actions/meeting.server.actions";
import { getAllProfiles } from "@/lib/actions/profile.server.actions";
import { getAllSessions } from "@/lib/actions/session.server.actions";
import { endOfWeek, startOfWeek } from "date-fns";

export default async function MySchedulePage() {
  const currentWeek = new Date();
  const currWeekStart = startOfWeek(currentWeek).toISOString();
  const currWeekEnd = endOfWeek(currentWeek).toISOString();

  const meetings = await getMeetings();
  const students = await getAllProfiles("Student");
  const tutors = await getAllProfiles("Tutor");
  const enrollments = await getAllActiveEnrollments();
  const sessions = await getAllSessions(currWeekStart, currWeekEnd, {
    orderBy: { field: "date", ascending: true },
  });

  return (
    <main>
      <ScheduleManagement
        initialCurrentWeek = {currentWeek}
        initialCurrWeekStart = {currWeekStart}
        initialCurrWeekEnd = {currWeekEnd}
        initialMeetings={meetings}
        initialStudents={students}
        initialTutors={tutors}
        initialEnrollments={enrollments}
        initialSessions={sessions}
      />
    </main>
  );
}
