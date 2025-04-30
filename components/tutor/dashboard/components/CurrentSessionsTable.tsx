import React from "react";
import { useState } from "react";
import { formatSessionDate, formatDateAdmin } from "@/lib/utils";
import { Session, Meeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Circle,
  CircleCheckBig,
  CircleX,
  Clock,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Trash,
  CalendarDays,
  UserRoundPlus,
  CircleCheck,
} from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import SessionExitForm from "./SessionExitForm";
import RescheduleForm from "./RescheduleDialog";

interface CurrentSessionTableProps {
  currentSessions: Session[];
  filteredSessions: Session[];
  meetings: Meeting[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: string;
  selectedSession: Session | null;
  selectedSessionDate: string | null;
  isDialogOpen: boolean;
  isSessionExitFormOpen: boolean;
  isCheckingMeetingAvailability: boolean;
  meetingAvailability: { [key: string]: boolean };
  notes: string;
  nextClassConfirmed: boolean;
  setSelectedSession: (session: Session | null) => void;
  setSelectedSessionDate: (date: string | null) => void;
  setIsDialogOpen: (open: boolean) => void;
  setIsSessionExitFormOpen: (open: boolean) => void;
  setNotes: (notes: string) => void;
  setNextClassConfirmed: (confirmed: boolean) => void;
  handleStatusChange: (session: Session) => void;
  handleReschedule: (sessionId: string, newDate: string) => void;
  handleSessionComplete: (
    session: Session,
    notes: string,
    isQuestionOrConcern: boolean,
    isFirstSession: boolean
  ) => void;
  handlePageChange: (page: number) => void;
  handleRowsPerPageChange: (value: string) => void;
  handleInputChange: (e: { target: { name: string; value: string } }) => void;
  areMeetingsAvailableInCurrentWeek: (session: Session, date: Date) => void;
}

const CurrentSessionsTable: React.FC<CurrentSessionTableProps> = ({
  currentSessions,
  filteredSessions,
  meetings,
  currentPage,
  totalPages,
  rowsPerPage,
  selectedSession,
  selectedSessionDate,
  isDialogOpen,
  isSessionExitFormOpen,
  isCheckingMeetingAvailability,
  meetingAvailability,
  notes,
  nextClassConfirmed,
  setSelectedSession,
  setSelectedSessionDate,
  setIsDialogOpen,
  setIsSessionExitFormOpen,
  setNotes,
  setNextClassConfirmed,
  handleStatusChange,
  handleReschedule,
  handleSessionComplete,
  handlePageChange,
  handleRowsPerPageChange,
  handleInputChange,
  areMeetingsAvailableInCurrentWeek,
}) => {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mark Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Meeting</TableHead>
            <TableHead>Session Exit Form</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentSessions.map((session, index) => (
            <TableRow
              key={index}

              // className={
              //     session.status === "Active"
              //     ? "bg-blue-200 opacity-20"
              //     : session.status === "Complete"
              //     ? "bg-green-200 opacity-50"
              //     : session.status === "Cancelled"
              //     ? "bg-red-100 opacity-50 "
              //     : ""
              // }
            >
              <TableCell>
                {session.status === "Active" ? (
                  <span className="px-3 py-1 inline-flex items-center rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    <Clock size={14} className="mr-1" />
                    Active
                  </span>
                ) : session.status === "Complete" ? (
                  <span className="px-3 py-1 inline-flex items-center rounded-full bg-green-100 text-green-800 border border-green-200">
                    <CircleCheckBig size={14} className="mr-1" />
                    Complete
                  </span>
                ) : session.status === "Cancelled" ? (
                  <span className="px-3 py-1 inline-flex items-center rounded-full bg-red-100 text-red-800 border border-red-200">
                    <CircleX size={14} className="mr-1" />
                    Cancelled
                  </span>
                ) : (
                  ""
                )}
              </TableCell>
              <TableCell>{formatSessionDate(session.date)}</TableCell>
              <TableCell className="font-medium">
                Tutoring Session with {session.student?.firstName}{" "}
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
                <SessionExitForm
                  currSession={session}
                  isSessionExitFormOpen={isSessionExitFormOpen}
                  setIsSessionExitFormOpen={setIsSessionExitFormOpen}
                  selectedSession={selectedSession}
                  setSelectedSession={setSelectedSession}
                  notes={notes}
                  setNotes={setNotes}
                  nextClassConfirmed={nextClassConfirmed}
                  setNextClassConfirmed={setNextClassConfirmed}
                  handleSessionComplete={handleSessionComplete}
                />
              </TableCell>
              <TableCell className="flex content-center">
                <RescheduleForm
                  session={session}
                  isDialogOpen={isDialogOpen}
                  selectedSession={selectedSession}
                  selectedSessionDate={selectedSessionDate}
                  isCheckingMeetingAvailability={isCheckingMeetingAvailability}
                  meetings={meetings}
                  meetingAvailability={meetingAvailability}
                  setIsDialogOpen={setIsDialogOpen}
                  setSelectedSession={setSelectedSession}
                  setSelectedSessionDate={setSelectedSessionDate}
                  areMeetingsAvailableInCurrentWeek={
                    areMeetingsAvailableInCurrentWeek
                  }
                  handleInputChange={handleInputChange}
                  handleReschedule={handleReschedule}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    (window.location.href =
                      "https://forms.gle/AC4an7K6NSNumDwKA")
                  }
                >
                  <UserRoundPlus className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    {" "}
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your Session will be canceled. This action cannot be
                        reversed
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const updatedSession: Session = {
                            ...session,
                            status: "Cancelled" as
                              | "Active"
                              | "Complete"
                              | "Cancelled",
                          };
                          handleStatusChange(updatedSession);
                        }}
                      >
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default CurrentSessionsTable;
