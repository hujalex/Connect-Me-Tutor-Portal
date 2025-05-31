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
} from "lucide-react";
import StudentCalendar from "./StudentCalendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getProfile } from "@/lib/actions/user.actions";
import { updateSession } from "@/lib/actions/session.actions";
import {
  getStudentSessions,
  rescheduleSession,
} from "@/lib/actions/student.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, Profile } from "@/types";
import { formatSessionDate } from "@/lib/utils";
import toast from "react-hot-toast";

const StudentDashboard = () => {
  const supabase = createClientComponentClient();
  const [sessions, setSessions] = useState<Session[]>([]);
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
  const [sessionSummary, setSessionSummary] = useState<string | null>("");
  const [isMeetingNotesOpen, setIsMeetingNotesOpen] = useState(false);

  useEffect(() => {
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

        const sessionsData = await getStudentSessions(
          profileData.id,
          undefined,
          undefined,
          ["Active", "Complete", "Cancelled"],
          "date",
          true
        );
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

    getUserData();
  }, [supabase.auth]);

  useEffect(() => {
    const filtered = sessions.filter(
      (session) =>
        session.tutor?.firstName
          .toLowerCase()
          .includes(filterValue.toLowerCase()) ||
        session.tutor?.lastName
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
    if (!profile || !profile.id) {
      console.error("Cannot reschedule: Student profile not loaded");
      // You might want to show an error message to the user here
      return;
    }

    try {
      await rescheduleSession(sessionId, newDate, profile.id);
      setSelectedSession(null);
      setIsDialogOpen(false);
      // You might want to show a success message to the user here
      console.log("Reschedule request submitted successfully");
    } catch (error) {
      console.error("Error requesting session reschedule:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleUpdateSessionSummary = async (updatedSession: Session) => {
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

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

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
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Tutor Notes</TableHead>
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
                        ? "bg-green-200 opacity-25"
                        : session.status === "Cancelled"
                          ? "bg-red-100 opacity-25"
                          : ""
                  }
                >
                  <TableCell>{formatSessionDate(session.date)}</TableCell>
                  <TableCell className="font-medium">
                    Tutoring Session with {session.tutor?.firstName}{" "}
                    {session.tutor?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.tutor?.firstName} {session.tutor?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.environment !== "In-Person" && (
                      <>
                        {/* {session.meetingId ? ( */}
                        {session?.meeting?.meetingId ? (
                          <button
                            // onClick={() =>
                            //   (window.location.href = `/meeting/${session.meetingId}`)
                            // }
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
                    <Dialog
                      open={isMeetingNotesOpen}
                      onOpenChange={setIsMeetingNotesOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsMeetingNotesOpen(true);
                            setSelectedSession(session);
                          }}
                        >
                          View Session Notes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Meeting Notes</DialogTitle>
                        </DialogHeader>
                        <Textarea>
                          {selectedSession?.session_exit_form}
                        </Textarea>
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
          <StudentCalendar sessions={sessions} />
        </div>
      </div>
    </main>
  );
};

export default StudentDashboard;
