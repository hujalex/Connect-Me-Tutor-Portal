"use client";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";

const mockWorksheets = [
  {
    id: 1,
    title: "8th Grade Algebra",
    description: "",
    link: "#",
  },
  {
    id: 2,
    title: "4th Grade Calculus",
    description: "",
    link: "#",
  },
  {
    id: 3,
    title: "10th Grade Addition",
    description: "",
    link: "#",
  },
];

export default function WorksheetsList() {
  return (
<main className="p-8">
  <h1 className="text-3xl font-semibold mb-6">Worksheets</h1>

  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {mockWorksheets.map((r) => (
      <Card
        key={r.id}
        className="transition-shadow hover:shadow-md"
      >
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-medium">
            {r.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {r.description}
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Button
            className="w-full"
            onClick={() => window.open(r.link, "_blank")}
          >
            Open
          </Button>
        </CardFooter>
      </Card>
    ))}
  </div>
</main>

  );
}
