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

interface RescheduleProps {
  session: Session;
  isDialogOpen: boolean;
  selectedSession: Session | null;
  selectedSessionDate: string | null;
  isCheckingMeetingAvailability: boolean;
  meetings: Meeting[];
  meetingAvailability: { [key: string]: boolean };
  setIsDialogOpen: (open: boolean) => void;
  setSelectedSession: (session: Session) => void;
  setSelectedSessionDate: (date: string) => void;
  areMeetingsAvailableInCurrentWeek: (session: Session, date: Date) => void;
  handleInputChange: (e: { target: { name: string; value: string } }) => void;
  handleReschedule: (sessionId: string, newDate: string) => void;
}

const RescheduleForm: React.FC<RescheduleProps> = ({
  session,
  isDialogOpen,
  selectedSession,
  selectedSessionDate,
  isCheckingMeetingAvailability,
  meetings,
  meetingAvailability,
  setIsDialogOpen,
  setSelectedSession,
  setSelectedSessionDate,
  areMeetingsAvailableInCurrentWeek,
  handleInputChange,
  handleReschedule,
}) => {
  const updatedSelectedDate = (isostring: string) => {
    setSelectedSessionDate(isostring);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSession(session);
              setIsDialogOpen(true);
              setSelectedSessionDate(session.date);
            }}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reschedule Session with {selectedSession?.student?.firstName}{" "}
              {selectedSession?.student?.lastName} on{" "}
              {formatSessionDate(selectedSession?.date || "")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <Input
              type="datetime-local"
              disabled={isCheckingMeetingAvailability}
              defaultValue={
                selectedSession?.date
                  ? format(parseISO(selectedSession.date), "yyyy-MM-dd'T'HH:mm")
                  : ""
              }
              onChange={async (e) => {
                if (selectedSession) {
                  const rescheduledDate = new Date(e.target.value);
                  setSelectedSessionDate(rescheduledDate.toISOString());
                  await areMeetingsAvailableInCurrentWeek(
                    selectedSession,
                    rescheduledDate
                  );
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
                <SelectTrigger>
                  <SelectValue placeholder="Select a meeting link">
                    {selectedSession?.meeting?.id
                      ? meetingAvailability[selectedSession.meeting.id]
                        ? meetings.find(
                            (meeting) =>
                              meeting.id === selectedSession?.meeting?.id
                          )?.name
                        : "Please select an available link"
                      : "Select a meeting"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {meetings.map((meeting) => (
                    <SelectItem
                      key={meeting.id}
                      value={meeting.id}
                      disabled={!meetingAvailability[meeting.id]}
                      className={`flex items-center justify-between`}
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
                handleReschedule(selectedSession?.id, selectedSessionDate)
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
    </>
  );
};

export default RescheduleForm;
