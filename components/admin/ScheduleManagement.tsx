"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  parseISO,
  isAfter,
  isValid,
  previousDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProfileSelector from "@/components/ui/profile-selector";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "../ui/command";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scrollarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Circle, Loader2, ChevronDown, Check } from "lucide-react";
import {
  getAllSessions,
  rescheduleSession,
  getAllEnrollments,
  addSessions,
  updateSession,
  getMeetings,
  getAllProfiles,
  removeSession,
  getMeeting,
  addOneSession,
  checkMeetingsAvailability,
  // isMeetingAvailable,
} from "@/lib/actions/admin.actions";
// Add these imports at the top of the file
import { addHours, areIntervalsOverlapping } from "date-fns";

// Add these state variables to your component
// const [meetingAvailability, setMeetingAvailability] = useState<
//   Record<string, boolean>
// >({});
import { getProfileWithProfileId } from "@/lib/actions/user.actions";
import { toast, Toaster } from "react-hot-toast";
import { Session, Enrollment, Meeting, Profile } from "@/types";
import { getSessionTimespan } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  GraduationCap,
  CircleUserRound,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { boolean } from "zod";

const Schedule = () => {
  console.log("Component rendered"); // Add this to verify component rendering
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //-----Checking Meeting Availability-----

  const [isCheckingMeetingAvailability, setIsCheckingMeetingAvailability] =
    useState(false);
  const [meetingAvailabilityMap, setMeetingAvailabilityMap] = useState<
    Record<string, boolean>
  >({});
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  //---------------------------------

  const [openStudentOptions, setOpenStudentOptions] = useState(false);
  const [openTutorOptions, setOpentTutorOptions] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [tutorSearch, setTutorSearch] = useState("");
  const [newSession, setNewSession] = useState<Partial<Session>>({
    student: {
      id: "",
      createdAt: "",
      role: "Student",
      userId: "",
      firstName: "",
      lastName: "",
      startDate: "",
      availability: [],
      email: "",
      timeZone: "",
      subjectsOfInterest: [],
      status: "Active",
      tutorIds: [],
      studentNumber: null,
    },
    tutor: {
      id: "",
      createdAt: "",
      role: "Student",
      userId: "",
      firstName: "",
      lastName: "",
      startDate: "",
      availability: [],
      email: "",
      timeZone: "",
      subjectsOfInterest: [],
      status: "Active",
      tutorIds: [],
      studentNumber: null,
    },
    date: new Date().toISOString(),
    summary: "",
  });

  const formatDateForInput = (isoDate: string | undefined): string => {
    if (!isoDate) return "";
    try {
      return format(parseISO(isoDate), "yyyy-MM-dd'T'HH:mm");
    } catch (e) {
      console.error("Invalid date:", e);
      return "";
    }
  };

  // interface Session {
  //   id: string;
  //   createdAt: string;
  //   environment: "Virtual" | "In-Person";
  //   student: Profile | null;
  //   tutor: Profile | null;
  //   date: string;
  //   summary: string;
  //   // meetingId: string;p
  //   meeting?: Meeting | null;
  //   status: "Active" | "Complete" | "Cancelled";
  //   session_exit_form: string;
  // }

  useEffect(() => {
    fetchSessions();
    fetchEnrollments();
    fetchMeetings();
    fetchStudents();
    fetchTutors();
  }, [currentWeek]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);
      const weekStartString = weekStart.toISOString();
      const weekEndString = weekEnd.toISOString();
      const fetchedSessions = await getAllSessions(
        weekStartString,
        weekEndString,
        "date",
        true
      );
      setSessions(fetchedSessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      console.log("ds");
      const fetchedEnrollments = await getAllEnrollments();
      console.log(fetchedEnrollments);
      const validEnrollments = fetchedEnrollments?.filter((enrollment) => {
        console.log(enrollment.endDate);
        if (!enrollment.endDate) return true;
        return isAfter(parseISO(enrollment.endDate), new Date());
      });
      if (validEnrollments) {
        setEnrollments(validEnrollments);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      toast.error("Failed to load enrollments");
    }
  };

  const fetchMeetings = async () => {
    try {
      const fetchedMeetings = await getMeetings();
      if (fetchedMeetings) {
        setMeetings(fetchedMeetings);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      toast.error("Failed to load meetings");
    }
  };

  const fetchStudents = async () => {
    try {
      const fetchedStudents = await getAllProfiles("Student");
      if (fetchedStudents) {
        setStudents(fetchedStudents);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    }
  };

  const fetchTutors = async () => {
    try {
      const fetchedTutors = await getAllProfiles("Tutor");
      if (fetchedTutors) {
        setTutors(fetchedTutors);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleReschedule = async (sessionId: string, newDate: Date) => {
    try {
      const newDateString = newDate.toISOString();
      await rescheduleSession(sessionId, newDateString);
      toast.success("Session rescheduled successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to reschedule session:", error);
      toast.error("Failed to reschedule session");
    }
  };

  const fetchAllSessionsFromSchedule = async () => {
    try {
      const data = await getAllSessions();
      if (!data) throw new Error("Unable to retrieve all sessions");
      setAllSessions(data);
    } catch (error) {
      console.error("Failed to fetch all sessions", error);
      throw error;
    }
  };

  const isMeetingAvailable = async (session: Session) => {
    try {
      setIsCheckingMeetingAvailability(true);
      if (Object.keys(meetingAvailabilityMap).length === 0)
        await fetchAllSessionsFromSchedule();

      const updatedMeetingAvailability: { [key: string]: boolean } = {};

      if (!session.date || !isValid(parseISO(session.date))) {
        toast.error("Invalid session date selected");
        return;
      }

      meetings.forEach((meeting) => {
        updatedMeetingAvailability[meeting.id] = true;
      });
      const requestedSessionStartTime = parseISO(session.date);
      const requestedSessionEndTime = addHours(requestedSessionStartTime, 1);

      meetings.forEach((meeting) => {
        const hasConflict = allSessions.some(
          (existingSession) =>
            session.id !== existingSession.id &&
            existingSession.meeting?.id === meeting.id &&
            areIntervalsOverlapping(
              {
                start: requestedSessionStartTime,
                end: requestedSessionEndTime,
              },
              {
                start: parseISO(existingSession.date),
                end: addHours(parseISO(existingSession.date), 1),
              }
            )
        );
        updatedMeetingAvailability[meeting.id] = !hasConflict;
      });
      setMeetingAvailabilityMap(updatedMeetingAvailability);
    } catch (error) {
      toast.error("Unable to find available meeting links");
      console.error("Unable to find available meeting links", error);
    } finally {
      setIsCheckingMeetingAvailability(false);
    }
  };

  const handleUpdateWeek = async () => {
    try {
      //------Set Loading-------
      setLoading(true);

      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);

      console.log("FLAG");

      // Create sessions for all enrollments without checking meeting availability
      const newSessions = await addSessions(
        weekStart.toISOString(),
        weekEnd.toISOString(),
        enrollments,
        sessions
      );

      if (!newSessions) {
        throw new Error("No sessions were created");
      }

      const existingSessionMap = new Map();
      sessions.forEach((session) => {
        if (session?.date) {
          // Add null check for date
          const sessionDate = new Date(session.date);
          const key = `${session.student?.id}-${session.tutor?.id}-${
            isValid(sessionDate)
              ? format(sessionDate, "yyyy-MM-dd-HH:mm")
              : "invalid-date"
          }`;
          existingSessionMap.set(key, session);
        }
      });

      setSessions((prevSessions) => [...prevSessions, ...newSessions]);
      fetchSessions(); // Reloads only sessions
      toast.success(`${newSessions.length} new sessions added successfully`);
      console.log(`${newSessions.length} new sessions added sucessfully`);
    } catch (error: any) {
      console.error("Failed to add sessions:", error);
      toast.error(`Failed to add sessions. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions with valid dates for display
  const getValidSessionsForDay = (day: Date) => {
    return sessions.filter((session) => {
      if (!session?.date) return false;
      try {
        return (
          format(parseISO(session.date), "yyyy-MM-dd") ===
          format(day, "yyyy-MM-dd")
        );
      } catch (error) {
        console.error("Error filtering session:", error);
        return false;
      }
    });
  };

  const handleRemoveSession = async (sessionId: string) => {
    try {
      await removeSession(sessionId);
      setSessions((prevSessions) =>
        prevSessions.filter((session) => session.id !== sessionId)
      );
      fetchSessions();
      toast.success("Session removed successfully");
    } catch (error) {
      console.error("Failed to remove session", error);
      toast.error("Failed to remove session");
    }
  };

  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      await updateSession(updatedSession);
      toast.success("Session updated successfully");
      setIsModalOpen(false);
      fetchSessions();
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
    }
  };

  const handleAddSession = async () => {
    try {
      if (newSession) {
        await addOneSession(newSession as Session);
      }
      fetchSessions();
      toast.success("Added Session");
    } catch (error) {
      toast.error("Unable to add session");
      console.log("Unable to add session", error);
    }
  };

  const handleInputChange = (e: {
    target: { name: string; value: string };
  }) => {
    const { name, value } = e.target;

    setNewSession((prev) => {
      if (!prev) return {} as Session;

      // Create a copy of the previous state
      const updated = { ...prev };

      if (name.includes(".")) {
        const [parent, child] = name.split(".");

        // Type guard to ensure parent is a valid key of Session
        if (parent === "student" || parent === "tutor") {
          // Ensure parent object exists
          const parentObj = (updated[parent] || {}) as Profile;

          // Update the nested property
          updated[parent] = {
            ...parentObj,
            [child]: value,
          };
        }
      } else {
        // Type guard to ensure name is a valid key of Session
        if (name in updated) {
          (updated as any)[name] = value;
        }
      }

      return updated;
    });
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek),
  });

  const goToPreviousWeek = () =>
    setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
  const goToNextWeek = () =>
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));

  const getEnrollmentProgress = () => {
    const totalStudents = students.length;
    const studentsThisWeek = new Set(
      sessions.map((session) => session?.student?.id)
    ).size;
    return { totalStudents, studentsThisWeek };
  };

  return (
    <>
      <Toaster />
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-left text-gray-800">
          Schedule
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={goToPreviousWeek}
              className="flex items-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" /> Previous Week
            </Button>
            <h2 className="text-xl font-semibold text-gray-700">
              {format(weekDays[0], "MMMM d, yyyy")} -{" "}
              {format(weekDays[6], "MMMM d, yyyy")}
            </h2>
            <Button
              variant="outline"
              onClick={goToNextWeek}
              className="flex items-center"
            >
              Next Week <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <Button
            onClick={handleUpdateWeek}
            disabled={loading}
            className="mb-4"
          >
            {loading ? (
              <>
                Loading Sessions{"  "}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Update Week"
            )}
          </Button>
          <Dialog>
            <DialogTrigger>
              <Button className="mx-4" variant="secondary">
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Session</DialogTitle>
              </DialogHeader>

              <ScrollArea className="pr-4">
                {" "}
                <div className="grid gap-4 py-4">
                  <ProfileSelector
                    label="Student"
                    profiles={students}
                    selectedId={selectedStudentId}
                    onSelect={(id) => {
                      setSelectedStudentId(id);
                      handleInputChange({
                        target: { name: "student.id", value: id },
                      });
                    }}
                    placeholder="Select a student"
                  />

                  <ProfileSelector
                    label="Tutor"
                    profiles={tutors}
                    selectedId={selectedTutorId}
                    onSelect={(id) => {
                      setSelectedTutorId(id);
                      handleInputChange({
                        target: { name: "tutor.id", value: id },
                      });
                    }}
                    placeholder="Select a tutor"
                  />
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="datetime-local"
                      value={formatDateForInput(newSession.date)}
                      onChange={(e) => {
                        setNewSession({
                          ...newSession,
                          date: new Date(e.target.value).toISOString(),
                        });
                      }}
                      disabled={isCheckingMeetingAvailability}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="" className="text-right">
                      Meeting Link
                    </Label>
                    <div className="col-span-3">
                      {" "}
                      <Select
                        value={newSession?.meeting?.id || ""}
                        onOpenChange={(open) => {
                          console.log("Opening");
                          if (open && newSession) {
                            isMeetingAvailable(newSession as Session);
                          }
                        }}
                        onValueChange={async (value) => {
                          setNewSession({
                            ...newSession,
                            meeting: await getMeeting(value),
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {newSession?.meeting?.name || "Select a meeting"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {meetings.map((meeting) => (
                            <SelectItem
                              key={meeting.id}
                              value={meeting.id}
                              className="flex items-center justify-between"
                            >
                              <span>
                                {meeting.name} | {meeting.meetingId}
                              </span>
                              <Circle
                                className={`w-2 h-2 ml-2 ${
                                  meetingAvailabilityMap[meeting.id]
                                    ? "text-green-500"
                                    : "text-red-500"
                                } fill-current`}
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Other form fields */}
                  <Button
                    onClick={handleAddSession}
                    disabled={isCheckingMeetingAvailability}
                  >
                    {isCheckingMeetingAvailability ? (
                      <>
                        Checking Meeting Availability
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Add Session"
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {loading ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 animate-spin mx-auto text-blue-500" />
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border rounded-lg px-2 py-3 bg-gray-50"
                >
                  <h3 className="font-semibold mb-2 text-gray-700">
                    {format(day, "EEEE")}
                  </h3>
                  <p className="text-sm mb-4 text-gray-500">
                    {format(day, "MMM d")}
                  </p>
                  {getValidSessionsForDay(day).map((session) => (
                    <Card
                      onClick={() => {
                        setSelectedSession(session);
                        setIsModalOpen(true);
                      }}
                      key={session.id}
                      className={`hover:cursor-pointer hover:shadow-md mb-2 ${
                        session.status === "Complete"
                          ? "bg-green-500/10 border-2"
                          : session.status === "Cancelled"
                          ? "bg-red-500/10 border-2"
                          : "bg-white"
                      }`}
                    >
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold">
                          {session.tutor?.firstName} {session.tutor?.lastName}
                        </p>
                        <p className="text-xs font-normal">
                          {session?.student?.firstName}{" "}
                          {session?.student?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.summary}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getSessionTimespan(session.date)}
                        </p>
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded-lg mt-1 border ${
                            session.meeting != null
                              ? "border-green-300 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {session?.meeting != null &&
                          session?.meeting.name != null
                            ? session?.meeting.name
                            : "No Meeting Link"}
                        </div>

                        <Button
                          className="hidden mt-2 w-full text-xs h-6"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsModalOpen(true);
                          }}
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {sessions.filter(
                    (session) =>
                      session?.date &&
                      format(parseISO(session.date), "yyyy-MM-dd") ===
                        format(day, "yyyy-MM-dd")
                  ).length === 0 && (
                    <p className="text-sm text-gray-400 text-center">
                      No sessions
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-6 text-left text-gray-800">
            Enrollment Progress
          </h3>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Students:</p>
                  <p>{getEnrollmentProgress().totalStudents}</p>
                </div>
                <div>
                  <p className="font-medium">Students This Week:</p>
                  <p>{getEnrollmentProgress().studentsThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
            </DialogHeader>
            {selectedSession && (
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedSession?.status}
                    onValueChange={(
                      value: "Active" | "Complete" | "Cancelled"
                    ) => {
                      console.log("Selected value:", value);
                      if (value && selectedSession) {
                        const updatedSession = {
                          ...selectedSession,
                          status: value,
                        };
                        console.log("Updated session:", updatedSession);
                        setSelectedSession(updatedSession);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedSession?.status
                          ? selectedSession.status
                          : "Select status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tutor</Label>
                  <Select
                    value={selectedSession.tutor?.id}
                    onValueChange={async (value) => {
                      console.log(value);
                      const selectedTutor = await getProfileWithProfileId(
                        value
                      );
                      if (selectedTutor) {
                        setSelectedSession({
                          ...selectedSession,
                          tutor: selectedTutor,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedSession.tutor
                          ? `${selectedSession.tutor.firstName} ${selectedSession.tutor.lastName}`
                          : "Select a tutor"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tutors.map(
                        (tutor) =>
                          tutor.status !== "Inactive" && (
                            <SelectItem key={tutor.id} value={tutor.id}>
                              {tutor.firstName} {tutor.lastName}
                            </SelectItem>
                          )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student</Label>
                  <Select
                    value={selectedSession.student?.id}
                    onValueChange={async (value) => {
                      console.log(value);
                      const selectedStudent = await getProfileWithProfileId(
                        value
                      );
                      if (selectedStudent) {
                        setSelectedSession({
                          ...selectedSession,
                          student: selectedStudent,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedSession.student
                          ? `${selectedSession.student.firstName} ${selectedSession.student.lastName}`
                          : "Select a student"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(
                        (student) =>
                          student.status !== "Inactive" && (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName}
                            </SelectItem>
                          )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="datetime-local"
                    defaultValue={format(
                      parseISO(selectedSession.date),
                      "yyyy-MM-dd'T'HH:mm"
                    )}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        date: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Meeting</Label>
                  <Select
                    value={selectedSession?.meeting?.id || ""}
                    onOpenChange={(open) => {
                      console.log("Opening");
                      if (open && selectedSession) {
                        isMeetingAvailable(selectedSession as Session);
                      }
                    }}
                    onValueChange={async (value) =>
                      setSelectedSession({
                        ...selectedSession,
                        meeting: await getMeeting(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {selectedSession?.meeting?.name || "Select a meeting"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {meetings.map((meeting) => (
                        <SelectItem
                          key={meeting.id}
                          value={meeting.id}
                          className="flex items-center justify-between"
                        >
                          {/* <span>
                          {meeting.name} - {meeting.id}
                        </span> */}
                          <span>
                            {meeting.name} | {meeting.meetingId}
                          </span>
                          <Circle
                            className={`w-2 h-2 ml-2 ${
                              meetingAvailabilityMap[meeting.id]
                                ? "text-green-500"
                                : "text-red-500"
                            } fill-current`}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-right">Summary</Label>
                  <Textarea
                    value={selectedSession?.summary}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        summary: e.target.value,
                      })
                    }
                  ></Textarea>
                </div>
                <div className="flex flex-row justify-between">
                  <Button
                    disabled={isCheckingMeetingAvailability}
                    onClick={() => handleUpdateSession(selectedSession)}
                  >
                    {isCheckingMeetingAvailability ? (
                      <>
                        Checking Available Meeting Links
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Update Session"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveSession(selectedSession.id)}
                  >
                    Delete Session
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Schedule;
