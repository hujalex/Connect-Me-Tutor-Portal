import { formatMilitaryToStandardTime } from "@/lib/utils";

// Single Availability component that takes an array and formats it
const Availability = ({
  availability,
}: {
  availability: { day: string; startTime: string; endTime: string }[];
}) => (
  <div>
    <ul className="text-sm text-muted-foreground">
      {availability?.map((entry, index) => (
        <li key={index}>
          <span className="font-semibold">{entry.day}s:</span>{" "}
          {formatMilitaryToStandardTime(entry.startTime)}-
          {formatMilitaryToStandardTime(entry.endTime)} EST
        </li>
      ))}
    </ul>
  </div>
);

export default Availability;
