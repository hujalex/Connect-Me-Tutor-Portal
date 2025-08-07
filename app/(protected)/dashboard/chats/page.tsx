import { ChatList } from "@/components/chat/conversations/enrollment-conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAccountEnrollments } from "@/lib/actions/enrollments.action";
import { createClient, createServerClient } from "@/lib/supabase/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

interface ChatConversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  participants: Array<{
    name: string;
    avatar: string;
  }>;
}

const mockChats: ChatConversation[] = [
  {
    id: "1",
    name: "Design Team",
    avatar: "/diverse-professional-team.png",
    lastMessage: "The new mockups look great!",
    timestamp: "2m",
    unreadCount: 3,
    participants: [
      { name: "Alice", avatar: "/professional-woman.png" },
      { name: "Bob", avatar: "/man-designer.png" },
      { name: "Carol", avatar: "/creative-woman.png" },
    ],
  },
  {
    id: "2",
    name: "Sarah Chen",
    avatar: "/asian-woman-professional.png",
    lastMessage: "Can we schedule a call tomorrow?",
    timestamp: "15m",
    unreadCount: 1,
    participants: [{ name: "Sarah", avatar: "/asian-woman-professional.png" }],
  },
  {
    id: "3",
    name: "Project Alpha",
    avatar: "/project-management-team.png",
    lastMessage: "Updated the requirements doc",
    timestamp: "1h",
    unreadCount: 0,
    participants: [
      { name: "Mike", avatar: "/man-developer.png" },
      { name: "Lisa", avatar: "/woman-manager.png" },
      { name: "Tom", avatar: "/man-analyst.png" },
      { name: "Emma", avatar: "/woman-developer.png" },
    ],
  },
  {
    id: "4",
    name: "Marketing Squad",
    avatar: "/marketing-strategy-meeting.png",
    lastMessage: "Campaign results are in!",
    timestamp: "3h",
    unreadCount: 7,
    participants: [
      { name: "Jake", avatar: "/man-marketing.png" },
      { name: "Nina", avatar: "/woman-marketing.png" },
    ],
  },
  {
    id: "5",
    name: "David Rodriguez",
    avatar: "/placeholder-7yt48.png",
    lastMessage: "Thanks for the feedback",
    timestamp: "1d",
    unreadCount: 0,
    participants: [{ name: "David", avatar: "/placeholder-7yt48.png" }],
  },
];

export default async function ChatPage() {
  const supabase = createClient();
  const user = await supabase.auth.getUser();
  console.log("returned user");
  const userId = user.data.user?.id;
  if (!userId) redirect("/");
  const enrollments = await getAccountEnrollments(userId);
  console.log("Enrollments:", enrollments);
  return (
    <div className="flex flex-col h-screen">
      <ChatList
        enrollments={enrollments!}
        currentUserId="7b4dbab0-436b-4cfd-bdb5-2640caebe920"
      />
    </div>
  );
}
