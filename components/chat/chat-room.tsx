"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
// import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js";
import { Send, PaperclipIcon, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useProfile } from "@/hooks/auth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEnrollment } from "@/hooks/enrollments";

// Types for our chat components
export type User = {
  id: string;
  name: string;
  avatar_url?: string;
  role: "tutor" | "student";
  online?: boolean;
};

export type Message = {
  id: string;
  user_id: string;
  room_id: string;
  content: string;
  created_at: string;
  file?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
};

export type ChatRoomProps = {
  roomId: string;
  roomName?: string;
  supabaseUrl: string;
  supabaseKey: string;
  initialMessages?: Message[];
  initialUsers?: User[];
  onSendMessage?: (message: string) => void;
  onFileUpload?: (file: File) => void;
};

// Create a singleton Supabase client for the browser

export function ChatRoom({
  roomId,
  roomName,
  supabaseUrl,
  supabaseKey,
  initialMessages = [],
  initialUsers = [],
  onSendMessage,
  onFileUpload,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: number;
  }>({});
  const { enrollment } = useEnrollment(roomId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //   const { toast } = useToast()

  const supabase = createClientComponentClient();
  const { profile } = useProfile();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (enrollment) {
      setUsers({
        [enrollment.tutor.id]: {
          role: "tutor",
          id: enrollment.tutor.id,
          name: `${enrollment.tutor.first_name} ${enrollment.tutor.last_name}`,
        },
        [enrollment.student.id]: {
          role: "student",
          id: enrollment.student.id,
          name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
        },
      });
    }
  }, [enrollment]);

  // Load initial messages and subscribe to new ones
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);

        // Fetch messages for this room
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        console.log("Data: ", data);

        if (error) throw error;

        if (data) {
          setMessages(data as Message[]);
        }

        // Fetch users in this room
        // const { data: usersData, error: usersError } = await supabase
        //   .from("room_users")
        //   .select("*")
        //   .eq("room_id", roomId);

        // if (usersError) throw usersError;

        // if (usersData) {
        //   setUsers(usersData.map((item: any) => item.users) as User[]);
        // }
      } catch (error) {
        console.error("Error loading messages:", error);
        // toast({
        //   title: "Error loading messages",
        //   description: "Please try again later",
        //   variant: "destructive",
        // })
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Subscribe to user presence
    // const presenceSubscription = supabase
    //   .channel("room_presence")
    //   .on("presence", { event: "sync" }, () => {
    //     // Update online status of users
    //     const presenceState = presenceSubscription.presenceState();
    //     setUsers((prevUsers) =>
    //       prevUsers.map((user) => ({
    //         ...user,
    //         online: Object.keys(presenceState).includes(user.id),
    //       }))
    //     );
    //   })
    //   .subscribe();

    // Track current user's presence
    const trackPresence = async () => {
      // await presenceSubscription.track({ user_id: currentUser.id });
    };

    trackPresence();

    return () => {
      supabase.removeChannel(messagesSubscription);
      // supabase.removeChannel(presenceSubscription);
    };
  }, [roomId, supabaseKey, supabaseUrl]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    try {
      const newMessage = {
        room_id: roomId,
        user_id: profile!.id,
        content: messageInput,
      };

      console.log("trying: ", newMessage);

      const { error } = await supabase.from("messages").insert([newMessage]);

      if (error) throw error;

      setMessageInput("");

      if (onSendMessage) {
        onSendMessage(messageInput);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // toast({
      //   title: "Error sending message",
      //   description: "Please try again",
      //   variant: "destructive",
      // });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileId = `${Date.now()}-${file.name}`;

    try {
      // Start tracking upload progress
      setUploadingFiles((prev) => ({ ...prev, [fileId]: 0 }));

      // Upload file to Supabase Storage
      const filePath = `${roomId}/${profile.id}/${fileId}`;
      const { data, error } = await supabase.storage
        .from("enrollment-chat-files")
        .upload(filePath, file, {});

      if (error) throw error;

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from("enrollment-chat-files")
        .getPublicUrl(filePath);

      // Create a message with the file attachment

      const newMessage = {
        room_id: roomId,
        user_id: profile.id,
        content: `Shared a file: ${file.name}`,
        file: {
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
        },
      };

      console.log("inserting new message: ", newMessage);
      const { error: msgError } = await supabase
        .from("messages")
        .insert([newMessage]);

      if (msgError) throw msgError;

      // Remove from uploading files
      setUploadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });

      if (onFileUpload) {
        onFileUpload(file);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      //   toast({
      //     title: "Error uploading file",
      //     description: "Please try again",
      //     variant: "destructive",
      //   })

      // Remove from uploading files on error
      setUploadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getUserById = (userId: string) => users[userId];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!profile) return <></>;

  return (
    <div className="flex h-full  border rounded-lg overflow-hidden bg-white">
      {/* Users sidebar */}
      <div className="w-64 border-r bg-gray-50 hidden md:block">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Participants</h3>
        </div>
        <ScrollArea className="h-full p-4">
          {Object.values(users).map((user) => (
            <div key={user.id} className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                {user.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <Badge
                  variant={user.role === "tutor" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">{roomName ?? `Chat Room`}</h2>
            <p className="text-sm text-gray-500">
              {Object.keys(users).length} participants
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const modal = document.getElementById("participants-modal");
              if (modal instanceof HTMLDialogElement) {
                modal.showModal();
              }
            }}
            className="md:hidden"
          >
            Participants
          </Button>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-20 w-[300px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                let user = getUserById(message.user_id);
                const isCurrentUser = message.user_id === profile!.id;

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${isCurrentUser ? "flex-row-reverse " : ""}`}
                  >
                    <Avatar>
                      <AvatarImage
                        src={user.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>

                    <div
                      className={`max-w-[70%] ${isCurrentUser ? "text-right" : "text-left"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-medium ${isCurrentUser ? "ml-auto" : ""}`}
                        >
                          {user.name}
                        </p>
                        <Badge
                          variant={
                            user.role === "tutor" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg p-3 inline-block max-w-[75%] min-w-[50px] ${
                          isCurrentUser
                            ? "bg-primary text-left text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {message.file && (
                          <div className="mt-2 p-3 bg-background rounded border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <PaperclipIcon className="h-4 w-4" />
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                  {message.file.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(message.file.size)}
                              </div>
                            </div>
                            <a
                              href={message.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* File upload progress indicators */}
              {Object.entries(uploadingFiles).map(([fileId, progress]) => (
                <div
                  key={fileId}
                  className="flex items-center justify-end gap-2"
                >
                  <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{progress}%</span>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !messageInput.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile participants modal */}
      <dialog id="participants-modal" className="modal">
        <div className="modal-box">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Participants</h3>
            <form method="dialog">
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <div className="space-y-3">
            {Object.values(users).map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <Badge
                    variant={user.role === "tutor" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
