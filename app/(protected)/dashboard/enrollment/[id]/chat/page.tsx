"use client";
import { ChatRoom, type User, type Message } from "@/components/chat/chat-room";

export default function Home() {
  // In a real app, these would come from your authentication system and API
  const currentUser: User = {
    id: "user-1",
    name: "John Doe",
    avatar_url: "/placeholder.svg?height=40&width=40",
    role: "student",
    online: true,
  };

  const mockUsers: User[] = [
    currentUser,
    {
      id: "user-2",
      name: "Dr. Sarah Smith",
      avatar_url: "/placeholder.svg?height=40&width=40",
      role: "tutor",
      online: true,
    },
    {
      id: "user-3",
      name: "Mike Johnson",
      avatar_url: "/placeholder.svg?height=40&width=40",
      role: "student",
      online: false,
    },
    {
      id: "user-4",
      name: "Emma Wilson",
      avatar_url: "/placeholder.svg?height=40&width=40",
      role: "student",
      online: true,
    },
  ];

  const mockMessages: Message[] = [
    {
      id: "msg-1",
      user_id: "user-2",
      room_id: "room-1",
      content:
        "Welcome to today's tutoring session! We'll be covering advanced calculus concepts.",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-2",
      user_id: "user-3",
      room_id: "room-1",
      content:
        "I'm having trouble with derivatives of implicit functions. Could we go over that?",
      created_at: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: "msg-3",
      user_id: "user-2",
      room_id: "room-1",
      content: "Let me share some examples.",
      created_at: new Date(Date.now() - 3400000).toISOString(),
      file: {
        name: "implicit_derivatives.pdf",
        url: "#",
        type: "application/pdf",
        size: 2500000,
      },
    },
    {
      id: "msg-4",
      user_id: "user-1",
      room_id: "room-1",
      content: "Thanks for sharing! I have a question about problem #3.",
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  // In a real app, these would come from your environment variables
  const supabaseUrl = "https://your-supabase-url.supabase.co";
  const supabaseKey = "your-supabase-anon-key";

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tutoring Session</h1>

      <ChatRoom
        roomId="room-1"
        currentUser={currentUser}
        supabaseUrl={supabaseUrl}
        supabaseKey={supabaseKey}
        initialMessages={mockMessages}
        initialUsers={mockUsers}
        onSendMessage={(message) => console.log("Message sent:", message)}
        onFileUpload={(file) => console.log("File uploaded:", file.name)}
      />
    </main>
  );
}
