"use client";

import { useState } from "react";
import { Check, Filter, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfilePairingMetadata } from "@/types/profile";
import { PairingRequestCard } from "./que/request-card";
import { PairingLogsTable } from "./pairing-logs";
import { useProfile } from "@/hooks/auth";
import { TestingPairingControls } from "./test-controls";

// Mock data for demonstration
const mockProfiles: (ProfilePairingMetadata & {
  name: string;
  role: string;
  rating: number;
})[] = [
  {
    profileId: "1",
    name: "Alex Johnson",
    role: "Tutor",
    rating: 4.8,
    availability: [
      { day: "Monday", startTime: "3:00 PM", endTime: "6:00 PM" },
      { day: "Wednesday", startTime: "4:00 PM", endTime: "7:00 PM" },
    ],
    subjectsOfInterest: ["Mathematics", "Physics"],
    languagesSpoken: ["English", "Spanish"],
  },
  {
    profileId: "2",
    name: "Jamie Smith",
    role: "Student",
    rating: 4.5,
    availability: [
      { day: "Tuesday", startTime: "5:00 PM", endTime: "8:00 PM" },
      { day: "Thursday", startTime: "4:00 PM", endTime: "6:00 PM" },
    ],
    subjectsOfInterest: ["Computer Science", "Mathematics"],
    languagesSpoken: ["English", "French"],
  },
  {
    profileId: "3",
    name: "Taylor Lee",
    role: "Tutor",
    rating: 4.9,
    availability: [
      { day: "Monday", startTime: "1:00 PM", endTime: "5:00 PM" },
      { day: "Friday", startTime: "3:00 PM", endTime: "7:00 PM" },
    ],
    subjectsOfInterest: ["Biology", "Chemistry"],
    languagesSpoken: ["English", "Mandarin"],
  },
];

export function PairingInterface() {
  const [activeTab, setActiveTab] = useState("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | undefined>();
  const [requestedPairings, setRequestedPairings] = useState<string[]>([]);

  const { profile } = useProfile();

  const filteredProfiles = mockProfiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.subjectsOfInterest?.some((subject) =>
        subject.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSubject =
      !subjectFilter ||
      profile.subjectsOfInterest?.some((subject) => subject === subjectFilter);

    return matchesSearch && matchesSubject;
  });

  const handlePairingRequest = (profileId: string) => {
    setRequestedPairings((prev) => [...prev, profileId]);
    // In a real app, you would send this request to your backend
  };

  const allSubjects = Array.from(
    new Set(mockProfiles.flatMap((profile) => profile.subjectsOfInterest))
  );

  return (
    <div className="space-y-4">
      <div>
        <Tabs
          defaultValue="find"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">Incoming Pairings</TabsTrigger>
            <TabsTrigger value="requests">Requested Pairings</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or subject..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* <Select
              value={subjectFilter ?? ""}
              onValueChange={setSubjectFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by subject" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={""}>All Subjects</SelectItem>
                {allSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject! ?? ""}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <Card key={profile.profileId}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{profile.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            {profile.role}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          ★ {profile.rating.toFixed(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Subjects
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.subjectsOfInterest?.map((subject, i) => (
                              <Badge key={i} variant="secondary">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Languages
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.languagesSpoken?.map((language, i) => (
                              <Badge key={i} variant="outline">
                                {language}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={requestedPairings.includes(profile.profileId)}
                        onClick={() => handlePairingRequest(profile.profileId)}
                      >
                        {requestedPairings.includes(profile.profileId) ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            Request Sent
                          </>
                        ) : (
                          "Request Pairing"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">
                    No matching profiles found
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            {profile && <PairingRequestCard userId={profile.userId} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
