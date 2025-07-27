import { useState } from "react";

import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Session } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Radio } from "lucide-react";

interface CancellationFormProps {
  session: Session;
  handleStatusChange: (session: Session) => void;
  onClose: any;
}

type cancellationReasonType =
  | "studentUnavailable"
  | "studentAbsent"
  | "emergency"
  | "other"
  | null;

const CancellationForm: React.FC<CancellationFormProps> = ({
  session,
  handleStatusChange,
  onClose,
}) => {
  const [otherReason, setOtherReason] = useState<string>("");
  const [cancellationReason, setCancellationReason] =
    useState<cancellationReasonType>(null);

  const isCancellationOther = cancellationReason === "other";
  const isCancellationStudentAbsent =
    cancellationReason === "studentUnavailable";
  const isCancellationEmergency = cancellationReason === "emergency";

  return (
    <AlertDialogContent>
      {" "}
      <AlertDialogHeader>
        <AlertDialogTitle>Cancel Session</AlertDialogTitle>
        <AlertDialogDescription>
          Please provide an explanation for why this session is being cancelled
        </AlertDialogDescription>

        <RadioGroup
          value={cancellationReason || ""}
          onValueChange={(value: string | null) =>
            setCancellationReason(value as cancellationReasonType)
          }
        >
          <span className="space-x-2">
            <RadioGroupItem
              value="studentUnavailable"
              id="studentUnavailable"
            />
            <Label htmlFor="studentUnavailable">Student was unavailable</Label>
          </span>
          <span className="space-x-2">
            <RadioGroupItem value="emergency" id="emergency" />
            <Label htmlFor="emergency">Last Minute Emergency</Label>
          </span>
          <span className="space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other">Other</Label>
          </span>
        </RadioGroup>
        <Textarea
          placeholder="Write here..."
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
          className={isCancellationOther ? "" : "hidden"}
        ></Textarea>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Back</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            const updatedSession: Session = {
              ...session,
              status: (isCancellationStudentAbsent
                ? "Complete"
                : "Cancelled") as
                | "Active"
                | "Complete"
                | "Cancelled"
                | "Rescheduled",
              session_exit_form: isCancellationOther ? otherReason : "",
            };
            handleStatusChange(updatedSession);
            onClose();
          }}
        >
          Submit
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};
export default CancellationForm;
