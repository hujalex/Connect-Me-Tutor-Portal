"use client";
import { useEffect, useState } from "react";
import { getTutorSessions } from "@/lib/actions/tutor.actions";
import { getEvents } from "@/lib/actions/admin.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getProfile } from "@/lib/actions/user.actions";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Session, Event, Enrollment } from "@/types";
import { addDays, subDays } from "date-fns";
import {
  getAllEventHours,
  getAllSessionHoursWithStudent,
  getEventHoursRange,
  getSessionHoursByStudent,
  getSessionHoursRange,
  getSessionHoursRangeWithStudent,
} from "@/lib/actions/hours.actions";
import { get } from "http";

interface EnrollmentDetails {
  studentId: string;
  firstName: string;
  lastName: string;
  hours: number;
}


const Stats = () => {

  const supabase = createClientComponentClient();
  const [totalHours, setTotalHours] = useState<number>(0);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionHours, setSessionHours] = useState<Map<string, number>>(
    new Map()
  );
  const [studentSessions, setStudentSessions] = useState<EnrollmentDetails[]>([]);
  const [eventHours, setEventHours] = useState<Map<string, number>>(
    new Map()
  );

  //testing
  const [HoursInRange, setHoursInRange] = useState<number>(0);
  const [totalHoursWithStudent, setTotalHoursWithStudent] = useState<number>(0);

  useEffect(() => {
    //Fetches total tutoring hours where each session and event counts as one hour each
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) throw new Error("No user found");

        const profileData = await getProfile(user.id);
        if (!profileData) throw new Error("No profile found");

        const current = new Date();
        const weekBefore = subDays(current, 7);
        // const specificStudentId = "2f1ebfd0-a604-4748-82bb-d7977d1f275a";

        // Parallelize all independent API calls
        const [allCompletedSessions, allEvents] = await Promise.all([
          getTutorSessions(profileData.id, undefined, undefined, "Complete"),
          getEvents(profileData.id),
          fetchEnrollmentDetails(profileData.id),
        ]);

        // Process session hours map more efficiently
        const sessionMap = allCompletedSessions.reduce((map, session) => {
          const studentName = `${session.student?.firstName || ""} ${session.student?.lastName || ""
            }`.trim();

          if (studentName) {
            map.set(studentName, (map.get(studentName) || 0) + 1);
          }
          return map;
        }, new Map<string, number>());

        // Calculate event tutoring hours more efficiently
        const eventTutoringHours =
          allEvents?.reduce((total, event) => total + event.hours, 0) || 0;

        // Update all state at once
        setSessionHours(sessionMap);
        setTotalHours(allCompletedSessions.length + eventTutoringHours);
        setAllSessions(allCompletedSessions);
        setAllEvents(allEvents);
      } catch (error) {
        console.log("Error counting hours", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase.auth]);

  const fetchEnrollmentDetails = async (tutorId: string) => {
    try {
      const data: EnrollmentDetails[] = await getSessionHoursByStudent(tutorId);
      console.log(data);
      
      setStudentSessions(data);
    } catch (error) {

    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Hours</h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading Hours...</p>
        </div>
      ) : (
        <div className="flex space-x-6">
          <div className="flex-grow bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionHours.size === 0 && allEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No tutoring hours or events recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Array.from(sessionHours.entries()).map(
                      ([student, hours]) => (
                        <TableRow key={student}>
                          <TableCell>Session</TableCell>
                          <TableCell>{student}</TableCell>
                          <TableCell>{hours}</TableCell>
                        </TableRow>
                      )
                    )}
                    {allEvents.map((event) => (
                      <TableRow key={event.id}>

                        <TableCell>Event</TableCell>
                        <TableCell>{event.summary}</TableCell>
                        <TableCell>{event.hours}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell>{totalHours}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <Table>
              <TableBody>
                {studentSessions.map((session) => (
                  <TableRow key={session.studentId}>
                    <TableCell>{session.firstName} {session.lastName}</TableCell>
                    <TableCell>{session.hours}</TableCell>

                  </TableRow>
                ))
                }

              </TableBody>

            </Table>
          </div>
        </div>
      )}
    </main>
  );
};

export default Stats;
