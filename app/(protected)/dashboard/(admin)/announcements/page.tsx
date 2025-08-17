"use client";

import { ChatRoom } from "@/components/chat/chat-room";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/auth";
import { useState } from "react";

type AnnouncementsRooms = "tutors" | "students" | "all";

export default function AnnouncementsPage() {
  const [currentRoom, setCurrentRoom] = useState<AnnouncementsRooms>("tutors");
  const { profile } = useProfile();
  if (!profile) return <>Loading...</>;
  return (
    <main className="h-[90dvh] p-4">
      {profile.role === "Admin" && (
        <div>
          <Select>
            <SelectTrigger className="">
              <SelectValue placeholder="Announcements Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Announcement Rooms</SelectLabel>
                <SelectItem value="apple">All</SelectItem>
                <SelectItem value="banana">Tutors</SelectItem>
                <SelectItem value="blueberry">Students</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="h-full ">
        <ChatRoom announcements roomName="Tutor Announcements" roomId="" />
      </div>
    </main>
  );
}
