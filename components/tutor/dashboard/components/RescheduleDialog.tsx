import React from "react";
import { useState } from "react";
import { formatSessionDate, formatDateAdmin } from "@/lib/utils";
import { Session, Meeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  updateSession,
  getMeetings,
  getAllSessions,
} from "@/lib/actions/admin.actions";
import { toast } from "react-hot-toast";

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
import { Circle, Loader2, CalendarDays } from "lucide-react";
import {
  format,
  parseISO,
  isAfter,
  addHours,
  addWeeks,
  areIntervalsOverlapping,
} from "date-fns";

/**
 * Props interface for the RescheduleForm component
 */
interface RescheduleProps {
  /** The session to be rescheduled */
  session: Session;
  /** Controls whether the reschedule dialog is open */
  isDialogOpen: boolean;
  /** The currently selected session for rescheduling */
  selectedSession: Session | null;
  /** The new date/time selected for the session */
  selectedSessionDate: string | null;
  /** Array of available meeting links */
  meetings: Meeting[];
  /** Function to control dialog open/close state */
  setIsDialogOpen: (open: boolean) => void;
  /** Function to set the selected session */
  setSelectedSession: (session: Session) => void;
  /** Function to set the selected session date */
  setSelectedSessionDate: (date: string) => void;
  /** Function to handle input changes in the form */
  handleInputChange: (e: { target: { name: string; value: string } }) => void;
  /** Function to handle the actual rescheduling process */
  handleReschedule: (
    sessionId: string,
    newDate: string,
    meetingId: string
  ) => void;
}

/**
 * RescheduleForm Component
 *
 * A dialog component that allows users to reschedule a session by:
 * - Selecting a new date and time
 * - Choosing an available meeting link
 * - Checking for conflicts with existing sessions
 *
 * @param props - The props for the RescheduleForm component
 * @returns JSX element representing the reschedule form dialog
 */
const RescheduleForm: React.FC<RescheduleProps> = ({
  session,
  isDialogOpen,
  selectedSession,
  selectedSessionDate,
  meetings,
  setIsDialogOpen,
  setSelectedSession,
  setSelectedSessionDate,
  handleInputChange,
  handleReschedule,
}) => {
  /** State to track if meeting availability is being checked */
  const [isCheckingMeetingAvailability, setisCheckingMeetingAvailability] =
    useState(false);
  /** State to store meeting availability status for each meeting link */
  const [meetingAvailability, setMeetingAvailability] = useState<{
    [key: string]: boolean;
  }>({});

  /**
   * Fetches all sessions within a 24-hour window around the requested date
   * @param requestedDate - The date to search around for existing sessions
   * @returns Promise resolving to array of sessions or undefined
   */
  const fetchDaySessionsFromSchedule = async (requestedDate: Date) => {
    if (requestedDate) {
      try {
        const startDateSearch = addHours(requestedDate, -12).toISOString();

        const endDateSearch = addHours(requestedDate, 12).toISOString();
        const data = await getAllSessions(startDateSearch, endDateSearch);
        return data;
      } catch (error) {
        console.error("Failed to fetch sessions for day");
        throw error;
      }
    }
  };

  /**
   * Gets the number of meetings that have been checked for availability
   * @returns Number of meetings in the availability object
   */
  const getMeetingAvailabilityLength = () => {
    return Object.keys(meetingAvailability).length;
  };

  /**
   * Checks which meeting links are available for the requested session time
   * by comparing against existing sessions to detect conflicts
   *
   * @param session - The session being rescheduled
   * @param requestedDate - The new requested date/time for the session
   */
  const areMeetingsAvailableInCurrentWeek = async (
    session: Session,
    requestedDate: Date
  ) => {
    try {
      console.log("Requested Session", requestedDate);
      setisCheckingMeetingAvailability(true);

      const sessionsToSearch =
        await fetchDaySessionsFromSchedule(requestedDate);

      const updatedMeetingAvailability: { [key: string]: boolean } = {};

      meetings.forEach((meeting) => {
        updatedMeetingAvailability[meeting.id] = true;
      });

      const requestedSessionStartTime = requestedDate;
      const requestedSessionEndTime = addHours(requestedSessionStartTime, 1);
      console.log("Requested date", selectedSessionDate);

      meetings.forEach((meeting) => {
        const hasConflict = sessionsToSearch
          ? sessionsToSearch.some((existingSession) => {
              console.log(
                "Checking session:",
                existingSession.id,
                existingSession.date
              );

              return (
                session.id !== existingSession.id &&
                existingSession.meeting?.id === meeting.id &&
                areIntervalsOverlapping(
                  {
                    start: requestedSessionStartTime,
                    end: requestedSessionEndTime,
                  },
                  {
                    start: existingSession.date
                      ? parseISO(existingSession.date)
                      : new Date(),
                    end: existingSession.date
                      ? addHours(parseISO(existingSession.date), 1)
                      : new Date(),
                  }
                )
              );
            })
          : false;
        updatedMeetingAvailability[meeting.id] = !hasConflict;
      });
      console.log("Updated Meeting Availability", updatedMeetingAvailability);
      setMeetingAvailability(updatedMeetingAvailability);
    } catch (error) {
      toast.error("Unable to find available meeting links");
      console.error("Unable to find available meeting links", error);
    } finally {
      setisCheckingMeetingAvailability(false);
    }
  };

  /**
   * Updates the selected session date state
   * @param isostring - The new date in ISO string format
   */
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
            <CalendarDays color="#3b82f6" className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reschedule Session with {selectedSession?.student?.firstName}{" "}
              {selectedSession?.student?.lastName}
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
              onBlur={async (e) => {
                if (selectedSession) {
                  const rescheduledDate = new Date(e.target.value);
                  setSelectedSessionDate(rescheduledDate.toISOString());
                  await areMeetingsAvailableInCurrentWeek(
                    selectedSession,
                    rescheduledDate
                  );
                }
              }}
              // max={addWeeks(new Date(), 2)}
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
                selectedSession.meeting?.id &&
                handleReschedule(
                  selectedSession?.id,
                  selectedSessionDate,
                  selectedSession.meeting?.id
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
    </>
  );
};

export default RescheduleForm;
