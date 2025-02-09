import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Session } from "@/types";
import next from "next";

const FormSchema = z.object({
  formResponse: z.string(),
});

interface SessionExitFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onComplete: (session: Session, notes: string) => void;
}

export default function SessionExitForm({
  isOpen,
  onOpenChange,
  session,
  onComplete,
}: SessionExitFormProps) {
  const [notes, setNotes] = useState<string>("");
  const [nextClassConfirmed, setNextClassConfirmed] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedSession(session);
            onOpenChange(true);
            console.log(session);
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
          <label htmlFor="next-class" className="text-sm font-medium">
            Does your student know about your next class?
          </label>
        </div>
        <Button
          onClick={() =>
            selectedSession &&
            onComplete(selectedSession, notes) &&
            onOpenChange(false)
          }
          disabled={!selectedSession || !notes || !nextClassConfirmed}
        >
          Mark Session Complete
        </Button>
      </DialogContent>
    </Dialog>
  );
}
