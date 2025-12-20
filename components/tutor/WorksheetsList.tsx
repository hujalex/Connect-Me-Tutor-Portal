"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockWorksheets = [
  {
    id: 1,
    title: "Algebra Basics",
    description: ".",
    link: "",
  },
  {
    id: 2,
    title: "Geometry Review",
    description: "",
    link: "",
  },
  {
    id: 3,
    title: "Chemistry Fundamentals",
    description: "",
    link: "",
  },
];

const WorksheetsList = () => {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Worksheets</h1>

      <div className="flex space-x-6">
        {mockWorksheets.map((r) => (
          <div
            key={r.id}
            className="border rounded-lg p-4 w-64 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {r.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {r.description}
              </p>
            </div>

            <Button
              className="mt-4"
              onClick={() => window.open(r.link, "_blank")}
            >
              Open
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default WorksheetsList;
