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
import AdminCalendar from "./AdminCalendar";
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
import { getAllSessions, rescheduleSession } from "@/lib/actions/admin.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, Profile } from "@/types";
import { formatSessionDate, formatDateAdmin } from "@/lib/utils";
import { time } from "console";

const AdminDashboard = () => {
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

  // Set Timezone to EST
  // useEffect(() => {
  //   // Override the Intl.DateTimeFormat().resolvedOptions().timeZone
  //   const originalResolvedOptions =
  //     Intl.DateTimeFormat.prototype.resolvedOptions;
  //   Intl.DateTimeFormat.prototype.resolvedOptions = function () {
  //     const options = originalResolvedOptions.call(this);
  //     return { ...options, timeZone: "America/New_York" };
  //   };

  //   // Override Date.prototype.getTimezoneOffset
  //   Date.prototype.getTimezoneOffset = function () {
  //     const nyFormatter = new Intl.DateTimeFormat("en-US", {
  //       timeZone: "America/New_York",
  //       timeZoneName: "short",
  //     });

  //     const timeZoneName = nyFormatter
  //       .formatToParts(this)
  //       .find((part) => part.type === "timeZoneName")?.value;

  //     return timeZoneName === "EDT" ? 240 : 300; // EST is UTC-5, so 300 minutes offset (240 for EDT)
  //   };

  //   console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
  // }, []);

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

        let sessionsData = await getAllSessions();
        if (!sessionsData) throw new Error("No sessions found");
        sessionsData = sessionsData.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

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
    const filtered = sessions.filter((session) => {
      const searchTerm = filterValue.toLowerCase().trim();

      if (!searchTerm) return true;

      const studentFirstName = session.student?.firstName?.toLowerCase();
      const studentLastName = session.student?.lastName?.toLowerCase();
      const studentEmail = session.student?.email?.toLowerCase();
      const tutorFirstName = session.tutor?.firstName?.toLowerCase();
      const tutorLastName = session.tutor?.lastName?.toLowerCase();
      const tutorEmail = session.tutor?.email?.toLowerCase();
      const studentFullName = `${studentFirstName} ${studentLastName}`.trim();
      const tutorFullName = `${tutorFirstName} ${tutorLastName}`.trim();

      return (
        studentFirstName?.includes(searchTerm) ||
        studentLastName?.includes(searchTerm) ||
        studentEmail?.includes(searchTerm) ||
        tutorFirstName?.includes(searchTerm) ||
        tutorLastName?.includes(searchTerm) ||
        tutorEmail?.includes(searchTerm) ||
        studentFullName.includes(searchTerm) ||
        tutorFullName.includes(searchTerm)
      );
    });
    // }) (
    //   (session) =>
    //     session.tutor?.firstName
    //       .toLowerCase()
    //       .includes(filterValue.toLowerCase()) ||
    //     session.tutor?.lastName
    //       .toLowerCase()
    //       .includes(filterValue.toLowerCase())
    // );
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
      await rescheduleSession(sessionId, newDate);
      setSelectedSession(null);
      setIsDialogOpen(false);
      // You might want to show a success message to the user here
    } catch (error) {
      console.error("Error requesting session reschedule:", error);
      // You might want to show an error message to the user here
    }
  };

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

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
                <TableHead>Student</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                        ? "bg-green-200 opacity-25 pointer-events-none"
                        : session.status === "Cancelled"
                          ? "bg-red-100 opacity-25 pointer-events-none"
                          : ""
                  }
                >
                  <TableCell>
                    {formatDateAdmin(session.date, true, true)}
                  </TableCell>
                  <TableCell className="font-medium">
                    Tutoring Session with Tutor {session.tutor?.firstName}{" "}
                    {session.tutor?.lastName} and Student{" "}
                    {session.student?.firstName} {session.student?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.tutor?.firstName} {session.tutor?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.student?.firstName} {session.student?.lastName}
                  </TableCell>
                  <TableCell>{session.environment}</TableCell>
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
                            View Link
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
                          }}
                        >
                          Reschedule
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Reschedule Session with {session.tutor?.firstName}{" "}
                            {session.tutor?.lastName} on{" "}
                            {formatSessionDate(session.date)}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                          <Input
                            type="datetime-local"
                            defaultValue={selectedSession?.date}
                            onChange={(e) => {
                              if (selectedSession) {
                                setSelectedSessionDate(e.target.value);
                              }
                            }}
                          />
                          <Button
                            variant="destructive"
                            onClick={() =>
                              selectedSession &&
                              selectedSessionDate &&
                              handleReschedule(
                                selectedSession?.id,
                                selectedSessionDate
                              )
                            }
                          >
                            Reschedule
                          </Button>
                        </div>
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
      </div>
    </main>
  );
};

export default AdminDashboard;
