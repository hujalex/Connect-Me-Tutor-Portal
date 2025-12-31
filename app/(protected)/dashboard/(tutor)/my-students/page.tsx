import StudentList from "@/components/tutor/StudentList";
import {
  cachedGetProfile,
  getTutorStudents,
} from "@/lib/actions/profile.server.actions";
import { cachedGetUser } from "@/lib/actions/user.server.actions";

export default async function MyStudentsPage() {
  const user = await cachedGetUser();
  const profile = await cachedGetProfile(user.id);
  if (!profile) throw new Error("Profile not found");
  const students = await getTutorStudents(profile.id);

  return (
    <main>
      <StudentList initialStudents={students} />
    </main>
  );
}
