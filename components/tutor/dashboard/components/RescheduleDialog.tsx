// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
// //   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Circle, Loader2 } from "lucide-react";
// import { Meeting, Session } from "@/types";
// import { formatSessionDate } from "@/lib/utils";
// import { format, parseISO } from "date-fns";

// interface RescheduleDialogProps {
//   session: Session;
//   meetings: Meeting[];
//   isCheckingMeetingAvailability: boolean;
//   meetingAvailability: { [key: string]: boolean };
//   onReschedule: (sessionId: string, newDate: string) => Promise<void>;
//   onMeetingCheck: (session: Session, date: string | null) => Promise<void>;
//   onMeetingChange: (name: string, value: string) => void;
// }

// export default function RescheduleDialog({
//   session,
//   meetings,
//   isCheckingMeetingAvailability,
//   meetingAvailability,
//   onReschedule,
//   onMeetingCheck,
//   onMeetingChange,
// }: RescheduleDialogProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<string | null>(session.date);

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="outline"
//           onClick={() => {
//             setSelectedDate(session.date);
//           }}
//         >
//           Reschedule
//         </Button>
//       </DialogTrigger>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>
//             Reschedule Session with {session.student?.firstName}{" "}
//             {session.student?.lastName} on{" "}
//             {formatSessionDate(session.date || "")}
//           </DialogTitle>
//         </DialogHeader>
//         <div className="py-4 space-y-6">
//           <Input
//             type="datetime-local"
//             disabled={isCheckingMeetingAvailability}
//             defaultValue={
//               session?.date
//                 ? format(parseISO(session.date), "yyyy-MM-dd'T'HH:mm")
//                 : ""
//             }
//             onChange={(e) => {
//               const newDate = new Date(e.target.value).toISOString();
//               setSelectedDate(newDate);
//               onMeetingCheck(session, newDate);
//             }}
//           />

//           <div>
//             <Label>Meeting Link</Label>
//             <Select
//               name="meeting.id"
//               value={session?.meeting?.id}
//               onOpenChange={(open) => {
//                 if (open) {
//                   onMeetingCheck(session, selectedDate);
//                 }
//               }}
//               onValueChange={(value) => onMeetingChange("meeting.id", value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select a meeting link">
//                   {session?.meeting?.id
//                     ? meetingAvailability[session.meeting.id]
//                       ? meetings.find((m) => m.id === session?.meeting?.id)
//                           ?.name
//                       : "Please select an available link"
//                     : "Select a meeting"}
//                 </SelectValue>
//               </SelectTrigger>
//               <SelectContent>
//                 {meetings.map((meeting) => (
//                   <SelectItem
//                     key={meeting.id}
//                     value={meeting.id}
//                     disabled={!meetingAvailability[meeting.id]}
//                     className="flex items-center justify-between"
//                   >
//                     <span>
//                       {meeting.name} - {meeting.id}
//                     </span>
//                     <Circle
//                       className={`w-2 h-2 ml-2 ${
//                         meetingAvailability[meeting.id]
//                           ? "text-green-500"
//                           : "text-red-500"
//                       } fill-current`}
//                     />
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <Button
//             disabled={
//               isCheckingMeetingAvailability ||
//               !session?.meeting?.id ||
//               !meetingAvailability[session.meeting.id]
//             }
//             onClick={() => {
//               if (selectedDate) {
//                 onReschedule(session.id, selectedDate);
//                 setIsOpen(false);
//               }
//             }}
//           >
//             {isCheckingMeetingAvailability ? (
//               <>
//                 Checking Meeting Link Availability{"   "}
//                 <Loader2 className="mx-2 h-4 w-4 animate-spin" />
//               </>
//             ) : (
//               "Send Reschedule Request"
//             )}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
