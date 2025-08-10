import { ChatList } from "@/components/chat/conversations/enrollment-conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAccountEnrollments } from "@/lib/actions/enrollments.action";
import { getProfileRole } from "@/lib/actions/user.actions";
import { createClient, createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = createClient();
  const user = await supabase.auth.getUser();
  console.log("returned user");
  const userId = user.data.user?.id;
  if (!userId) redirect("/");

  const [enrollments, role] = await Promise.all([
    getAccountEnrollments(userId),
    getProfileRole(userId),
  ]);
  console.log("Enrollments:", enrollments);
  return (
    <div className="flex flex-col h-screen">
      <ChatList
        enrollments={enrollments!}
        currentUserId="7b4dbab0-436b-4cfd-bdb5-2640caebe920"
        role={role as any}
      />
    </div>
  );
}
