// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useState } from "react";
// import { Session } from "@/types";
// import next from "next";
// import toast from "react-hot-toast";

// const FormSchema = z.object({
//   formResponse: z.string(),
// });

// interface SessionExitFormProps {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   session: Session | null;
//   onComplete: (session: Session, notes: string) => void;
// }

// export default function SessionExitForm({
//   isOpen,
//   onOpenChange,
//   session,
//   onComplete,
// }: SessionExitFormProps) {
//   const [notes, setNotes] = useState<string>("");
//   const [nextClassConfirmed, setNextClassConfirmed] = useState<boolean>(false);
//   const [selectedSession, setSelectedSession] = useState<Session | null>(null);

//   const onFormSubmission = async () => {
//     if (selectedSession) {
//       console.log("SUBMITTED SESSION", selectedSession);
//       onComplete(selectedSession, notes);
//       onOpenChange(false);
//     } else {
//       toast.error("No Session Found");
//       console.log("No Session Found");
//     }
//   };

//   return (

//   );
// }
