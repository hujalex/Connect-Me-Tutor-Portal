"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

const mockWorksheets = [
  { id: 1, title: "Algebra Basics" },
  { id: 2, title: "Geometry Review" },
  { id: 3, title: "Chemistry Fundamentals" },
];

const WorksheetsList = () => {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Worksheets</h1>

      <div className="flex space-x-6">
        {mockWorksheets.map((r) => (
          <Card
            key={r.id}
            className="w-80 transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-semibold text-center">
                {r.title}
              </CardTitle>
            </CardHeader>

            <CardFooter>
              <Button className="w-full">
                Open
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default WorksheetsList;
