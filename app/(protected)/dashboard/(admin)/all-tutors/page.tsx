import TutorList from '@/components/admin/TutorList'
import { getAllProfiles } from '@/lib/actions/profile.server.actions'

export default async function MyTutorsPage() {
    const tutors = await getAllProfiles("Tutor", "created_at", false)
    return (
        <main>
            <TutorList initialTutors={tutors}/>
        </main>
    )
}