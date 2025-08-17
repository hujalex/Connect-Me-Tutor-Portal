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
import {
  StudentAnnouncementsRoomId,
  TutorAnnouncementRoomId,
} from "@/constants/chat";
import { useProfile } from "@/hooks/auth";
import { useEffect, useState } from "react";

type AnnouncementsRooms = "tutors" | "students" | "all";

export default function AnnouncementsPage() {
  const [currentRoom, setCurrentRoom] = useState<AnnouncementsRooms>("tutors");
  const { profile } = useProfile();
  const [roomID, setRoomID] = useState<string>(TutorAnnouncementRoomId);
  useEffect(() => {
    if (profile && profile.role !== "Admin") {
      setCurrentRoom(profile.role === "Tutor" ? "tutors" : "students");
    }
  }, [profile]);

  useEffect(() => {
    setRoomID(
      currentRoom === "students"
        ? StudentAnnouncementsRoomId
        : TutorAnnouncementRoomId
    );
  }, [currentRoom]);
  if (!profile || !roomID) return <>Loading...</>;
  return (
    <main className="h-[90dvh] p-4">
      {profile.role === "Admin" && (
        <div>
          <Select
            value={currentRoom}
            onValueChange={(value) =>
              setCurrentRoom(value as AnnouncementsRooms)
            }
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Announcements Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Announcement Rooms</SelectLabel>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="tutors">Tutors</SelectItem>
                <SelectItem value="students">Students</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="h-full pb-5 ">
        <ChatRoom
          announcements
          roomName={`${currentRoom === "tutors" ? "Tutor" : "Student"} Announcements`}
          roomId={roomID}
        />
      </div>
    </main>
  );
}
