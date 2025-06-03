// import { useState, useEffect } from "react";
// import { getMeetings, getAllSessions } from "@/lib/actions/admin.actions";
// import { Meeting, Session } from "@/types";
// import toast from "react-hot-toast";
// import { parseISO, addHours, areIntervalsOverlapping, isValid } from "date-fns";

// export const useMeetings = () => {
//   const [meetings, setMeetings] = useState<Meeting[]>([]);
//   const [allSessions, setAllSessions] = useState<Session[]>([]);
//   const [isCheckingMeetingAvailability, setIsCheckingMeetingAvailability] =
//     useState(false);
//   const [meetingAvailability, setMeetingAvailability] = useState<{
//     [key: string]: boolean;
//   }>({});

//   const fetchMeetings = async () => {
//     try {
//       const fetchedMeetings = await getMeetings();
//       if (fetchedMeetings) {
//         setMeetings(fetchedMeetings);
//       }
//     } catch (error) {
//       console.error("Failed to fetch meetings:", error);
//       toast.error("Failed to load meetings");
//     }
//   };

//   const fetchAllSessionsFromSchedule = async () => {
//     try {
//       const data = await getAllSessions();
//       if (!data) throw new Error("Unable to retrieve all sessions");
//       setAllSessions(data);
//       return data;
//     } catch (error) {
//       console.error("Failed to fetch all sessions", error);
//       toast.error("Unable to check availability");
//       throw error;
//     }
//   };

//   const checkMeetingAvailability = async (
//     session: Session,
//     selectedSessionDate: string | null
//   ) => {
//     try {
//       setIsCheckingMeetingAvailability(true);

//       if (Object.keys(meetingAvailability).length === 0) {
//         await fetchAllSessionsFromSchedule();
//       }

//       const updatedMeetingAvailability: { [key: string]: boolean } = {};

//       if (!selectedSessionDate || !isValid(parseISO(selectedSessionDate))) {
//         toast.error("Invalid session date selected");
//         return;
//       }

//       meetings.forEach((meeting) => {
//         updatedMeetingAvailability[meeting.id] = true;
//       });

//       const requestedSessionStartTime = parseISO(selectedSessionDate);
//       const requestedSessionEndTime = addHours(requestedSessionStartTime, 1);

//       meetings.forEach((meeting) => {
//         const hasConflict = allSessions.some(
//           (existingSession) =>
//             session.id !== existingSession.id &&
//             existingSession.meeting?.id === meeting.id &&
//             areIntervalsOverlapping(
//               {
//                 start: requestedSessionStartTime,
//                 end: requestedSessionEndTime,
//               },
//               {
//                 start: parseISO(existingSession.date),
//                 end: addHours(parseISO(existingSession.date), 1),
//               }
//             )
//         );
//         updatedMeetingAvailability[meeting.id] = !hasConflict;
//       });

//       setMeetingAvailability(updatedMeetingAvailability);
//     } catch (error) {
//       toast.error("Unable to find available meeting links");
//       console.error("Unable to find available meeting links", error);
//     } finally {
//       setIsCheckingMeetingAvailability(false);
//     }
//   };

//   useEffect(() => {
//     fetchMeetings();
//   }, []);

//   return {
//     meetings,
//     isCheckingMeetingAvailability,
//     meetingAvailability,
//     setMeetingAvailability,
//     checkMeetingAvailability,
//   };
// };
