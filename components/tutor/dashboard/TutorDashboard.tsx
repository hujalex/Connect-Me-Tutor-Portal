"use client";
import React, { useState, useEffect } from "react";
import TutorCalendar from "../TutorCalendar";
import { Input } from "@/components/ui/input";
import SessionsTable from "./components/ActiveSessionsTable";
import ActiveSessionsTable from "./components/ActiveSessionsTable";
import CompletedSessionsTable from "./components/CompletedSessionsTable";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getProfile } from "@/lib/actions/user.actions";
import {
  updateSession,
  getMeetings,
  getAllSessions,
} from "@/lib/actions/admin.actions";
import {
  getTutorSessions,
  rescheduleSession,
  recordSessionExitForm,
} from "@/lib/actions/tutor.actions";
import { Session, Profile, Meeting } from "@/types";
import toast from "react-hot-toast";
import { parseISO, addHours, areIntervalsOverlapping, isValid } from "date-fns";

const TutorDashboard = () => {
  const supabase = createClientComponentClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [filteredPastSessions, setFilteredPastSessions] = useState<Session[]>(
    []
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValueActiveSessions, setFilterValueActiveSessions] =
    useState("");
  const [filterValuePastSessions, setFilterValuePastSessions] = useState("");
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
  const [meetingAvailability, setMeetingAvailability] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    getUserData();
    fetchMeetings();
  }, []);

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

      const activeSessionData = await getTutorSessions(
        profileData.id,
        undefined,
        undefined,
        "Active",
        "date",
        true
      );

      setSessions(activeSessionData);
      setFilteredSessions(activeSessionData);

      const pastSessionData = await getTutorSessions(
        profileData.id,
        undefined,
        undefined,
        ["Complete", "Cancelled"],
        "date",
        true
      );
      setPastSessions(pastSessionData);
      setFilteredPastSessions(pastSessionData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
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

  const areMeetingsAvailableInCurrentWeek = async (session: Session) => {
    try {
      setisCheckingMeetingAvailability(true);
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
      const requestedSessionStartTime = parseISO(selectedSessionDate);
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
      setMeetingAvailability(updatedMeetingAvailability);
    } catch (error) {
      toast.error("Unable to find available meeting links");
      console.error("Unable to find available meeting links", error);
    } finally {
      setisCheckingMeetingAvailability(false);
    }
  };

  useEffect(() => {
    const filtered = sessions.filter(
      (session) =>
        session.student?.firstName
          .toLowerCase()
          .includes(filterValueActiveSessions.toLowerCase()) ||
        session.student?.lastName
          .toLowerCase()
          .includes(filterValueActiveSessions.toLowerCase())
    );
    setFilteredSessions(filtered);
    setCurrentPage(1);
  }, [filterValueActiveSessions, sessions]);

  useEffect(() => {
    const filtered = pastSessions.filter(
      (session) =>
        session.student?.firstName
          .toLowerCase()
          .includes(filterValuePastSessions.toLowerCase()) ||
        session.student?.lastName
          .toLowerCase()
          .includes(filterValuePastSessions.toLowerCase())
    );
    setFilteredPastSessions(filtered);
    setCurrentPage(1);
  }, [filterValuePastSessions, sessions]);

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

      const updatedSession = await rescheduleSession(sessionId, newDate);

      if (updatedSession) {
        setSessions(
          sessions.map((e: Session) =>
            e.id === updatedSession.id ? updatedSession : e
          )
        );
      }
      getUserData();
      setSelectedSession(null);
      setIsDialogOpen(false);
      toast.success("Session updated successfully");
    } catch (error) {
      console.error("Error requesting session reschedule:", error);
      toast.error("Failed to reschedule session");
    }
  };

  const handleStatusChange = async (updatedSession: Session) => {
    try {
      await updateSession(updatedSession);
      setSessions(
        sessions.map((e: Session) =>
          e.id === updatedSession.id ? updatedSession : e
        )
      );
      toast.success("Session updated successfully");
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
    }
  };

  const handleSessionComplete = async (
    updatedSession: Session,
    notes: string,
    isQuestionOrConcern: boolean,
    isFirstSession: boolean
  ) => {
    try {
      await recordSessionExitForm(updatedSession.id, notes);
      updatedSession.status = "Complete";
      updatedSession.isQuestionOrConcern = isQuestionOrConcern;
      updatedSession.isFirstSession = isFirstSession;
      await updateSession(updatedSession);
      setSessions(
        sessions.map((e: Session) =>
          e.id === updatedSession.id ? updatedSession : e
        )
      );
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

  const paginatedPastSessions = filteredPastSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleInputChange = (e: {
    target: { name: string; value: string };
  }) => {
    const { name, value } = e.target;

    // Helper function to handle nested updates
    const handleNestedChange = (obj: any, key: string, value: any) => {
      const keys = key.split(".");
      let temp = obj;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          temp[k] = value;
        } else {
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
  };

  return (
    <>
      {" "}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Tutor Dashboard</h1>

        <div className="flex space-x-6">
          <div className="flex-grow bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Filter sessions..."
                  className="w-64"
                  value={filterValueActiveSessions}
                  onChange={(e) => setFilterValueActiveSessions(e.target.value)}
                />
              </div>
            </div>

            <ActiveSessionsTable
              paginatedSessions={paginatedSessions}
              filteredSessions={filteredSessions}
              meetings={meetings}
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage.toString()}
              selectedSession={selectedSession}
              selectedSessionDate={selectedSessionDate}
              isDialogOpen={isDialogOpen}
              isSessionExitFormOpen={isSessionExitFormOpen}
              isCheckingMeetingAvailability={isCheckingMeetingAvailability}
              meetingAvailability={meetingAvailability}
              notes={notes}
              nextClassConfirmed={nextClassConfirmed}
              setSelectedSession={setSelectedSession}
              setSelectedSessionDate={setSelectedSessionDate}
              setIsDialogOpen={setIsDialogOpen}
              setIsSessionExitFormOpen={setIsSessionExitFormOpen}
              setNotes={setNotes}
              setNextClassConfirmed={setNextClassConfirmed}
              handleStatusChange={handleStatusChange}
              handleReschedule={handleReschedule}
              handleSessionComplete={handleSessionComplete}
              handlePageChange={handlePageChange}
              handleRowsPerPageChange={handleRowsPerPageChange}
              handleInputChange={handleInputChange}
              areMeetingsAvailableInCurrentWeek={
                areMeetingsAvailableInCurrentWeek
              }
            />
          </div>

          <div className="w-80">
            <TutorCalendar sessions={sessions} />
          </div>
        </div>
      </div>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Past Sessions</h1>

        <div className="flex space-x-6">
          <div className="flex-grow bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Filter sessions..."
                  className="w-64"
                  value={filterValuePastSessions}
                  onChange={(e) => setFilterValuePastSessions(e.target.value)}
                />
              </div>
            </div>

            <CompletedSessionsTable
              paginatedSessions={paginatedPastSessions}
              filteredSessions={filteredPastSessions}
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage.toString()}
              selectedSession={selectedSession}
              setSelectedSession={setSelectedSession}
              handlePageChange={handlePageChange}
              handleRowsPerPageChange={handleRowsPerPageChange}
            />
          </div>

          <div className="w-80">
            {/* <TutorCalendar sessions={sessions} /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorDashboard;
