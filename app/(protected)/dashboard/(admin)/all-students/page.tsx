import StudentList from '@/components/admin/StudentList'
import { getAllProfiles } from '@/lib/actions/profile.server.actions'

export default async function MyStudentsPage() {
    const students = await getAllProfiles("Student", "created_at", false)
    return (
        <main>
            <StudentList initialStudents = {students}/>
        </main>
    )
}