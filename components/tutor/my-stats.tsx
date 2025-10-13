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
  getAllEventDetailsForTutor,
  getAllEventHours,
  getAllEventHoursBatchWithType,
  getAllSessionHoursWithStudent,
  getEventHoursRange,
  getSessionHoursByStudent,
  getSessionHoursRange,
  getSessionHoursRangeWithStudent,
} from "@/lib/actions/hours.actions";
import { get } from "http";
import { StaticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage.external";
import toast from "react-hot-toast";
import { TabletSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { table } from "console";

interface EnrollmentDetails {
  studentId: string;
  firstName: string;
  lastName: string;
  hours: number;
}

interface EventDetails {
  eventId: string;
  date: any;
  hours: number;
  summary: string;
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
  const [enrollmentDetails, setEnrollmentDetails] = useState<
    EnrollmentDetails[]
  >([]);

  const [eventDetails, setEventDetails] = useState<{
    [key: string]: EventDetails[];
  }>({});

  const [activeTab, setActiveTab] = useState("cards");
  const [expandedSections, setExpandedSections] = useState(
    new Set(["TUTORING"])
  );

  const toggleSection = (section: any) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const tabs = [
    { id: "cards", label: "Card Layout" },
    { id: "unified", label: "Unified Table" },
  ];

  console.log("Enrollment Details", enrollmentDetails)
  const totalSessionHours = Object.values(enrollmentDetails).flat().reduce(
    (sum, e) => sum + e.hours,
    0
  );
  const totalEventHours = Object.values(eventDetails)
    .flat()
    .reduce((sum, e) => sum + e.hours, 0);
  const totalAllHours = totalSessionHours + totalEventHours;

  // const [eventHours, setEventHours] = useState<Map<string, number>>(new Map());

  // //testing
  // const [HoursInRange, setHoursInRange] = useState<number>(0);
  // const [totalHoursWithStudent, setTotalHoursWithStudent] = useState<number>(0);

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
          // getTutorSessions(profileData.id, undefined, undefined, "Complete"),
          // getEvents(profileData.id),
          fetchEventDetails(profileData.id),
          fetchEnrollmentDetails(profileData.id),
        ]);

        // // Process session hours map more efficiently
       
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
      console.log(data[0]);

      setEnrollmentDetails(data);
    } catch (error) {
      toast.error("Unable to fetch enrollment details");
    }
  };

  const fetchEventDetails = async (tutorId: string) => {
    try {
      const data: { [key: string]: EventDetails[] } =
        await getAllEventDetailsForTutor(tutorId);
      console.log(data);
      setEventDetails(data);
    } catch (error) {
      toast.error("Unable to fetch event details");
    }
  };

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">My Hours</h1>
      <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-700 hover:bg-gray-200"
                : " bg-white text-gray-600 hover:bg-gray-200"
            }
              `}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "unified" && (
        <Card>
          {" "}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(enrollmentDetails).map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>Sessions</TableCell>
                  <TableCell>Tutoring</TableCell>
                  <TableCell>
                    {student.firstName + " " + student.lastName}
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{student.hours}</TableCell>
                </TableRow>
              ))}
              {Object.entries(eventDetails).map(([eventType, events]) =>
                events.map((event) => (
                  <TableRow key={`event-${event.eventId}`}>
                    <TableCell>Events</TableCell>
                    <TableCell>{eventType}</TableCell>
                    <TableCell>{event.summary}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.hours}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell>{totalAllHours}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}

      {activeTab === "cards" && (
        <div className="space-y-6">
          {/* <div className="text-lg font-semibold">Card</div> */}
          <Card>
            <CardHeader>
              <CardTitle>Hours Summary</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#1e40af]">
                  {totalSessionHours}
                </div>
                <div className="text-sm text-gray-600">Session Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1e40af]">
                  {totalEventHours}
                </div>
                <div className="text-sm text-gray-600">Event Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1e40af]">
                  {totalAllHours}
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>
            <CardFooter></CardFooter>
          </Card>

          <div className="gap-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Students</CardTitle>
              </CardHeader>
              <Card className="m-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Student</TableHead>
                      <TableHead>Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(enrollmentDetails).map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.hours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Card>

            <Card className="my-6">
              <CardHeader>
                <CardTitle className="text-lg">Events</CardTitle>
              </CardHeader>
              {Object.entries(eventDetails).map(([eventType, events]) => (
                <Card key={eventType} className="m-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{eventType}</CardTitle>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Summary</TableHead>
                        <TableHead>Hours</TableHead>`
                        `
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.eventId}>
                          <TableCell>{event.summary}</TableCell>
                          <TableCell>{event.hours}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading Hours...</p>
        </div>
      ) : (
        <div className="flex space-x-6">
          <div className="flex-grow bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {" "}
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
                <TableCaption>Sessions</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4">
                        No student sessions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollmentDetails.map((enrollment) => (
                      <TableRow key={enrollment.studentId}>
                        <TableCell>
                          {enrollment.firstName} {enrollment.lastName}
                        </TableCell>
                        <TableCell>{enrollment.hours}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              {Object.entries(eventDetails).map(([eventType, events]) => (
                <Table key={eventType}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell>{eventType}</TableCell>
                        <TableCell>{event.summary}</TableCell>
                        <TableCell>{event.hours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </main>
  );
};

export default Stats;
