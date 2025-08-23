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
import { Clock, Plus, X, AlertCircle } from "lucide-react";
import { Availability } from "@/types";

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

// Helper function to convert time string to minutes for comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to check if a time range is valid within open availabilities
const isValidTimeRange = (
  day: string,
  startTime: string,
  endTime: string,
  openAvailabilities: Availability[]
): boolean => {
  if (!day || !startTime || !endTime) return false;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) return false;

  // Find all open slots for the selected day
  const daySlots = openAvailabilities.filter((slot) => slot.day === day);

  // Check if the selected time range falls within any open slot
  return daySlots.some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return startMinutes >= slotStart && endMinutes <= slotEnd;
  });
};

// Generate time options for a specific day based on open availabilities
const generateTimeOptions = (
  day: string,
  openAvailabilities: Availability[],
  type: "start" | "end" = "start"
) => {
  if (!day) return [];

  const daySlots = openAvailabilities.filter((slot) => slot.day === day);
  const timeSet = new Set<string>();

  daySlots.forEach((slot) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);

    // Generate 15-minute intervals within each slot
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 15) {
      if (type === "end" && minutes === startMinutes) continue; // Skip start time for end options
      if (type === "start" && minutes === endMinutes) continue; // Skip end time for start options

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      timeSet.add(timeString);
    }
  });

  return Array.from(timeSet).sort();
};

const AvailabilityForm2: React.FC<AvailabilityFormProps> = ({
  availabilityList,
  setAvailabilityList,
  openAvailabilities,
}) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [validationError, setValidationError] = useState("");

  // Get available days from openAvailabilities
  const availableDays = [
    ...new Set(openAvailabilities.map((slot) => slot.day)),
  ];

  // Get time options based on selected day
  const startTimeOptions = generateTimeOptions(
    selectedDay,
    openAvailabilities,
    "start"
  );
  const endTimeOptions = generateTimeOptions(
    selectedDay,
    openAvailabilities,
    "end"
  ).filter((time) =>
    selectedStartTime
      ? timeToMinutes(time) > timeToMinutes(selectedStartTime)
      : true
  );

  const addAvailability = () => {
    setValidationError("");

    if (!selectedDay || !selectedStartTime || !selectedEndTime) {
      setValidationError("Please select day, start time, and end time.");
      return;
    }

    if (
      !isValidTimeRange(
        selectedDay,
        selectedStartTime,
        selectedEndTime,
        openAvailabilities
      )
    ) {
      setValidationError(
        "Selected time range must fall within available time slots."
      );
      return;
    }

    // Check for overlaps with existing availability
    const hasOverlap = availabilityList.some((existing) => {
      if (existing.day !== selectedDay) return false;

      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      const newStart = timeToMinutes(selectedStartTime);
      const newEnd = timeToMinutes(selectedEndTime);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      setValidationError(
        "This time range overlaps with existing availability."
      );
      return;
    }

    const updatedList = [
      ...availabilityList,
      {
        day: selectedDay,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
      },
    ];

    setAvailabilityList(updatedList);
    setSelectedDay("");
    setSelectedStartTime("");
    setSelectedEndTime("");
  };

  const removeAvailability = (index: number) => {
    const updatedList = availabilityList.filter((_, i) => i !== index);
    setAvailabilityList(updatedList);
  };

  // Quick add function to add from open availabilities
  const quickAddAvailability = (availability: Availability) => {
    // Check for overlaps before adding
    const hasOverlap = availabilityList.some((existing) => {
      if (existing.day !== availability.day) return false;

      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      const newStart = timeToMinutes(availability.startTime);
      const newEnd = timeToMinutes(availability.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (!hasOverlap) {
      const updatedList = [...availabilityList, availability];
      setAvailabilityList(updatedList);
      setValidationError("");
    } else {
      setValidationError("This time slot overlaps with existing availability.");
    }
  };

  // Reset end time when start time changes
  const handleStartTimeChange = (startTime: string) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(""); // Reset end time when start time changes
    setValidationError("");
  };

  // Reset times when day changes
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setSelectedStartTime("");
    setSelectedEndTime("");
    setValidationError("");
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

        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="day" className="text-right">
              Day:
            </Label>
            <Select
              name="day"
              value={selectedDay}
              onValueChange={handleDayChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-time" className="text-right">
              Start Time:
            </Label>
            <Select
              value={selectedStartTime}
              onValueChange={handleStartTimeChange}
              disabled={!selectedDay}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {startTimeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatTime(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="end-time" className="text-right">
              End Time:
            </Label>
            <Select
              value={selectedEndTime}
              onValueChange={setSelectedEndTime}
              disabled={!selectedStartTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {endTimeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatTime(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            add custom times within the open availability windows.
          </p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityForm2;
