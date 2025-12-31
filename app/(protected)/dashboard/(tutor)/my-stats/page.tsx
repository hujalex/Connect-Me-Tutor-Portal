import Stats from "@/components/tutor/my-stats";
import { getAllEventDetailsForTutor } from "@/lib/actions/hours.server.actions";
import { getSessionHoursByStudent } from "@/lib/actions/hours.server.actions";
import { cachedGetProfile } from "@/lib/actions/profile.server.actions";
import { cachedGetUser } from "@/lib/actions/user.server.actions";

export default async function myStatsPage() {
  const user = await cachedGetUser();
  const profile = await cachedGetProfile(user.id);
  if (!profile) throw new Error("Unable to find profile");
  const [enrollmentDetails, eventDetails] = await Promise.all([
    getSessionHoursByStudent(profile.id),
    getAllEventDetailsForTutor(profile.id)
  ])

  return (
    <main>
      <Stats
        initialEnrollmentDetails={enrollmentDetails}
        initialEventDetails={eventDetails}
      />
    </main>
  );
}
