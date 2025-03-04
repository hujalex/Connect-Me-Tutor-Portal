"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Plus,
  Link as LinkIcon,
  Eye,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
} from "lucide-react";
import TutorCalendar from "./TutorCalendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getProfile } from "@/lib/actions/user.actions";
import {
  updateSession,
  getMeetings,
  getAllSessions,
} from "@/lib/actions/admin.actions";
import {
  getTutorSessions,
  rescheduleSession,
} from "@/lib/actions/tutor.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, Profile, Meeting } from "@/types";
import { formatSessionDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  parseISO,
  addHours,
  areIntervalsOverlapping,
  isAfter,
  isValid,
} from "date-fns";
// import SessionExitForm from "./SessionExitForm";
import { recordSessionExitForm } from "@/lib/actions/tutor.actions";

const TutorDashboard = () => {
  const supabase = createClientComponentClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSessionExitFormOpen, setIsSessionExitFormOpen] = useState(false);
  const [isCheckingMeetingAvailability, setisCheckingMeetingAvailability] =
    useState(false);
  const [notes, setNotes] = useState<string>("");
  const [nextClassConfirmed, setNextClassConfirmed] = useState<boolean>(false);

  //---Reschedule session
  const [meetingAvailability, setMeetingAvailability] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    console.log(isDialogOpen);
  }, [isDialogOpen]);

  useEffect(() => {
    getUserData();
    fetchMeetings();
  }, [supabase.auth]);

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

  const getUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) throw new Error("No user found");

      const profileData = await getProfile(user.id);
      if (!profileData) throw new Error("No profile found");

      setProfile(profileData);

      const endWeek = endOfWeek(new Date()).toISOString();

      const sessionsData = await getTutorSessions(
        profileData.id,
        undefined,
        endWeek
      ); // Params so that way tutor doesn't see sessions in later weeks
      if (!sessionsData) throw new Error("No sessions found");

      setSessions(sessionsData);
      setFilteredSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMeetingsThisCurrentWeek = async () => {};

  //---Fetches sessions from all tutors found om the tutor schedule
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

  const areMeetingsAvailableInCurrentWeek = async (session: Session) => {
    try {
      setisCheckingMeetingAvailability(true);
      //---Only retrieve sessions again if you haven't already
      if (Object.keys(meetingAvailability).length === 0)
        await fetchAllSessionsFromSchedule();

      const updatedMeetingAvailability: { [key: string]: boolean } = {};

      if (!selectedSessionDate || !isValid(parseISO(selectedSessionDate))) {
        toast.error("Invalid session date selected");
        return;
      }

      meetings.forEach((meeting) => {
        updatedMeetingAvailability[meeting.id] = true;
      });
      const requestedSessionStartTime = parseISO(selectedSessionDate); //selectedSessionDate is in UTC
      const requestedSessionEndTIme = addHours(requestedSessionStartTime, 1);

      meetings.forEach((meeting) => {
        const hasConflict = allSessions.some(
          (existingSession) =>
            session.id !== existingSession.id && //Check if the given and existing are the same session
            existingSession.meeting?.id === meeting.id &&
            areIntervalsOverlapping(
              {
                start: requestedSessionStartTime,
                end: requestedSessionEndTIme,
              },
              {
                start: parseISO(existingSession.date),
                end: addHours(parseISO(existingSession.date), 1),
              }
            )
        );
        updatedMeetingAvailability[meeting.id] = !hasConflict;
      });
      setMeetingAvailability(updatedMeetingAvailability);
      setisCheckingMeetingAvailability(false);
    } catch (error) {
      toast.error("Unable to find available meeting links");
      console.error("Unable to find available meeting links", error);
    }
  };

  useEffect(() => {
    const filtered = sessions.filter(
      (session) =>
        session.student?.firstName
          .toLowerCase()
          .includes(filterValue.toLowerCase()) ||
        session.student?.lastName
          .toLowerCase()
          .includes(filterValue.toLowerCase())
    );
    setFilteredSessions(filtered);
    setCurrentPage(1);
  }, [filterValue, sessions]);

  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleReschedule = async (sessionId: string, newDate: string) => {
    try {
      if (!profile || !profile.id) {
        console.error("No profile found cannot reschedule");
        return;
      }

      const updatedSession = await rescheduleSession(
        sessionId,
        newDate
        // profile.id
      );

      if (updatedSession) {
        setSessions(
          paginatedSessions.map((e: Session) =>
            e.id === updatedSession.id ? updatedSession : e
          ) as Session[]
        ); // Explicitly cast as Enrollment[]
      }
      getUserData();
      setSelectedSession(null);
      setIsDialogOpen(false);
      toast.success("Session updated successfully");
      // You might want to show a success message to the user here
      console.log("Reschedule request submitted successfully");
      //Update dashboard
    } catch (error) {
      console.error("Error requesting session reschedule:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleStatusChange = async (updatedSession: Session) => {
    console.log("Status Change");
    try {
      await updateSession(updatedSession);
      if (updatedSession) {
        setSessions(
          paginatedSessions.map((e: Session) =>
            e.id === updatedSession.id ? updatedSession : e
          ) as Session[]
        ); // Explicitly cast as Enrollment[]
      }
      toast.success("Session updated successfully");
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
    }
  };

  // const handleSessionExitForm = async () => {
  //   console.log("Set");
  //   setIsSessionExitFormOpen(true);
  // };

  const handleSessionComplete = async (
    updatedSession: Session,
    notes: string
  ) => {
    try {
      console.log(updatedSession);
      console.log(notes);
      await recordSessionExitForm(updatedSession.id, notes);
      updatedSession.status = "Complete";
      await updateSession(updatedSession);
      toast.success("Session Marked Complete");
      setIsSessionExitFormOpen(false);
      setNotes("");
      setNextClassConfirmed(false);
    } catch (error) {
      console.error("Failed to record Session Exit Form", error);
      toast.error("Failed to record Session Exit Form");
    }
  };

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleInputChange = (e: {
    target: { name: string; value: string };
  }) => {
    const { name, value } = e.target;

    // Helper function to handle nested updates
    const handleNestedChange = (obj: any, key: string, value: any) => {
      const keys = key.split("."); // Split key by dot notation (e.g., 'tutor.id')
      let temp = obj;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Final key, update its value
          temp[k] = value;
        } else {
          // Traverse nested objects
          temp[k] = temp[k] || {};
          temp = temp[k];
        }
      });

      return { ...obj };
    };

    if (selectedSession) {
      setSelectedSession((prevState) =>
        handleNestedChange({ ...prevState }, name, value)
      );
    }
    // else {
    //   setNewEnrollment((prevState) =>
    //     handleNestedChange({ ...prevState }, name, value)
    //   );
    // }
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tutor Dashboard</h1>

      <div className="flex space-x-6">
        <div className="flex-grow bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Filter sessions..."
                className="w-64"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mark Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Reschedule</TableHead>
                <TableHead>Request Substitute</TableHead>
                <TableHead>Mark Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessions.map((session, index) => (
                <TableRow
                  key={index}
                  className={
                    session.status === "Active"
                      ? ""
                      : session.status === "Complete"
                      ? "bg-green-200 opacity-50"
                      : session.status === "Cancelled"
                      ? "bg-red-100 opacity-50 "
                      : ""
                  }
                >
                  <TableCell>
                    <Select
                      value={session?.status}
                      onValueChange={(value) => {
                        const updatedSession: Session = {
                          ...session,
                          status: value,
                        };
                        handleStatusChange(updatedSession);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={session?.status}>
                          {session.status ? session.status : "Select Status"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className={
                          session.status === "Complete" ? "opacity-50" : ""
                        }
                      >
                        <SelectItem
                          value="Active"
                          className={
                            session.status === "Complete"
                              ? "pointer-events-none"
                              : ""
                          }
                        >
                          Active
                        </SelectItem>
                        {/* <SelectItem value="Complete">Complete</SelectItem> */}
                        <SelectItem
                          value="Cancelled"
                          className={
                            session.status === "Complete"
                              ? "pointer-events-none"
                              : ""
                          }
                        >
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatSessionDate(session.date)}</TableCell>
                  <TableCell className="font-medium">
                    Meeting with {session.student?.firstName}{" "}
                    {session.student?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.student?.firstName} {session.student?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.environment !== "In-Person" && (
                      <>
                        {session?.meeting?.meetingId ? (
                          <button
                            onClick={() =>
                              (window.location.href = `/meeting/${session?.meeting?.id}`)
                            }
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            View
                          </button>
                        ) : (
                          <button className="text-black px-3 py-1 border border-gray-200 rounded">
                            N/A
                          </button>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsDialogOpen(true);
                            setSelectedSessionDate(session.date);
                          }}
                        >
                          Reschedule
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Reschedule Session with{" "}
                            {selectedSession?.student?.firstName}{" "}
                            {selectedSession?.student?.lastName} on{" "}
                            {formatSessionDate(selectedSession?.date || "")}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                          <Input
                            type="datetime-local"
                            // defaultValue={selectedSession?.date}
                            disabled={isCheckingMeetingAvailability}
                            defaultValue={
                              selectedSession?.date
                                ? format(
                                    parseISO(selectedSession.date),
                                    "yyyy-MM-dd'T'HH:mm"
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              if (selectedSession) {
                                setSelectedSessionDate(
                                  new Date(e.target.value).toISOString() //Converts chosen time to UTC for correct timezone conversions later
                                );
                                setMeetingAvailability({}); // Reset Meeting Availability upon date change
                              }
                            }}
                          />

                          <div>
                            <Label>Meeting Link</Label>
                            <Select
                              name="meeting.id"
                              value={selectedSession?.meeting?.id}
                              onValueChange={(value) =>
                                handleInputChange({
                                  target: { name: "meeting.id", value },
                                } as any)
                              }
                            >
                              <SelectTrigger
                                onClick={() => {
                                  if (selectedSession) {
                                    areMeetingsAvailableInCurrentWeek(
                                      selectedSession
                                    );
                                  }
                                }}
                              >
                                <SelectValue placeholder="Select a meeting link">
                                  {selectedSession?.meeting?.id
                                    ? meetingAvailability[
                                        selectedSession.meeting.id
                                      ]
                                      ? meetings.find(
                                          (meeting) =>
                                            meeting.id ===
                                            selectedSession?.meeting?.id
                                        )?.name
                                      : "Please select an available link"
                                    : "Select a meeting"}
                                  {/* {selectedSession?.meeting?.id
                                    ? meetingAvailability[
                                        selectedSession.meeting.id
                                      ]
                                      ? ""
                                      : "Please select another link"
                                    : ""} */}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {meetings.map((meeting) => (
                                  <SelectItem
                                    key={meeting.id}
                                    value={meeting.id}
                                    disabled={!meetingAvailability[meeting.id]}
                                    className={`flex items-center justify-between ${!meetingAvailability[
                                      meeting.id
                                    ]} ? "opacity-50" : ""`}
                                  >
                                    <span>
                                      {meeting.name} - {meeting.id}
                                    </span>
                                    <Circle
                                      className={`w-2 h-2 ml-2 ${
                                        meetingAvailability[meeting.id]
                                          ? "text-green-500"
                                          : "text-red-500"
                                      } fill-current`}
                                    />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            disabled={
                              isCheckingMeetingAvailability ||
                              !selectedSession?.meeting?.id ||
                              !meetingAvailability[selectedSession.meeting.id]
                            }
                            onClick={() =>
                              selectedSession &&
                              selectedSessionDate &&
                              handleReschedule(
                                selectedSession?.id,
                                selectedSessionDate
                              )
                            }
                          >
                            {isCheckingMeetingAvailability ? (
                              <>
                                Checking Meeting Link Availability{"   "}
                                <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                              </>
                            ) : (
                              "Send Reschedule Request"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href =
                          "https://forms.gle/AC4an7K6NSNumDwKA")
                      }
                    >
                      Request a Sub
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={isSessionExitFormOpen}
                      onOpenChange={setIsSessionExitFormOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsSessionExitFormOpen(true);
                          }}
                        >
                          SEF
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Session Exit Form</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="In 2-4 sentences, What did you cover during your session?"
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="next-class"
                            checked={nextClassConfirmed}
                            onCheckedChange={(checked) =>
                              setNextClassConfirmed(checked === true)
                            }
                          />
                          <label
                            htmlFor="next-class"
                            className="text-sm font-medium"
                          >
                            Does your student know about your next class?
                          </label>
                        </div>
                        <Button
                          onClick={() =>
                            selectedSession &&
                            handleSessionComplete(selectedSession, notes)
                          }
                          disabled={!notes || !nextClassConfirmed}
                        >
                          Mark Session Complete
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-between items-center">
            <span>{filteredSessions.length} row(s) total.</span>
            <div className="flex items-center space-x-2">
              <span>Rows per page</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={handleRowsPerPageChange}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={rowsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80">
          <TutorCalendar sessions={sessions} />
        </div>
      </div>
    </main>
  );
};

export default TutorDashboard;
