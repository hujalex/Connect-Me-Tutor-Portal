import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // Adjust import as necessary
import { Button } from "@/components/ui/button"; // Import Button and other UI elements
import { Label } from "@/components/ui/label";
import { Availability, Profile } from "@/types";

interface UserAvailabilityListProps {
  profile: Profile;
}

export const UserAvailabilityList: React.FC<UserAvailabilityListProps> = ({ profile }: UserAvailabilityListProps) => {
  return (
    <>
      {profile.availability && profile.availability.length > 0 ? (
        <div className="grid gap-1 mt-1">
          {profile.availability.map((slot, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {slot.day}: {slot.startTime} - {slot.endTime}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No availability set</p>
      )}
    </>
  );
};
