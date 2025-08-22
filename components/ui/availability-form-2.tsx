import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, X } from "lucide-react";

// Define the type for availability
interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

// Define the props for the AvailabilityForm component
interface AvailabilityFormProps {
  availabilityList: Availability[];
  setAvailabilityList: (availability: Availability[]) => void;
  openAvailabilities: Availability[];
}

const formatTime = (time: string) => {
  if (time) {
    const [hours, minutes] = time.split(":");
    const formattedHours = Number(hours) % 12 || 12;
    const ampm = Number(hours) >= 12 ? "PM" : "AM";
    return `${formattedHours}:${minutes} ${ampm}`;
  }
};

const AvailabilityForm2: React.FC<AvailabilityFormProps> = ({
  availabilityList,
  setAvailabilityList,
  openAvailabilities,
}) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");

  const addAvailability = () => {
    if (selectedDay && selectedStartTime && selectedEndTime) {
      const updatedList = [
        ...availabilityList,
        {
          day: selectedDay,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
        },
      ];
      console.log(updatedList);
      setAvailabilityList(updatedList);
      setSelectedDay("");
      setSelectedStartTime("");
      setSelectedEndTime("");
    }
  };

  const removeAvailability = (index: number) => {
    const updatedList = availabilityList.filter((_, i) => i !== index);
    setAvailabilityList(updatedList);
  };

  // Quick add function to add from open availabilities
  const quickAddAvailability = (availability: Availability) => {
    const updatedList = [...availabilityList, availability];
    setAvailabilityList(updatedList);
  };

  // Group open availabilities by day
  const groupedOpenAvailabilities = openAvailabilities.reduce(
    (acc, availability) => {
      if (!acc[availability.day]) {
        acc[availability.day] = [];
      }
      acc[availability.day].push(availability);
      return acc;
    },
    {} as Record<string, Availability[]>
  );

  return (
    <div className="availability-form space-y-6">
      <div>
        <Label className="text-lg font-semibold">
          Manage Availability (EST)
        </Label>
      </div>

      {/* Show Open Availabilities Section */}
      {openAvailabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedOpenAvailabilities).map(([day, slots]) => (
                <div key={day} className="space-y-2">
                  <Label className="font-medium text-sm">{day}</Label>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors p-2"
                        onClick={() => quickAddAvailability(slot)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Click on any time slot to add it to your availability
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Manual Entry Section */}
      <div className="space-y-4">
        <Label className="font-medium">Add Custom Availability</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="day" className="text-right">
              Day:
            </Label>
            <Select
              name="day"
              value={selectedDay}
              onValueChange={(value) => setSelectedDay(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-time" className="text-right">
              Start Time:
            </Label>
            <input
              type="time"
              id="start-time"
              value={selectedStartTime}
              onChange={(e) => setSelectedStartTime(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>

          <div>
            <Label htmlFor="end-time" className="text-right">
              End Time:
            </Label>
            <input
              type="time"
              id="end-time"
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>
        </div>

        <Button onClick={addAvailability} className="mt-4">
          Add Availability
        </Button>
      </div>

      <Separator />

      {/* Current Availability List */}
      <div className="space-y-4">
        <Label className="font-medium">Your Selected Availability</Label>
        {availabilityList.length > 0 ? (
          <div className="space-y-2">
            {availabilityList.map((availability, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{availability.day}</strong> from{" "}
                    {formatTime(availability.startTime)} to{" "}
                    {formatTime(availability.endTime)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAvailability(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm bg-muted/50 p-4 rounded-lg border-dashed border-2">
            No availability selected. Choose from the available slots above or
            add custom times.
          </p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityForm2;
