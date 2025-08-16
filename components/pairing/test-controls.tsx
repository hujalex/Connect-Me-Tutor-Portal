import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export function TestingPairingControls() {
  const router = useRouter();
  const handleResolveQueues = () => {
    console.log("Resolving queues...");
  };

  const handleClearQueues = () => {
    console.log("Clearing queues...");
  };

  const handleResetPairings = () => {
    console.log("Resetting all pairing matches...");
  };

  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Testing Controls
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleResolveQueues} variant="outline" size="sm">
          Resolve Que's
        </Button>
        <Button onClick={handleClearQueues} variant="outline" size="sm">
          Clear Que's
        </Button>
        <Button
          onClick={() => router.push("/dashboard/pairing-que/logs")}
          variant="outline"
          size="sm"
        >
          Logs
        </Button>
        <Button onClick={handleResetPairings} variant="destructive" size="sm">
          Reset all pairing matches
        </Button>
      </div>
    </div>
  );
}
