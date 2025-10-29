"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Calendar,
  Download,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ParticipantEvent {
  id: string;
  participantId: string;
  name: string;
  email: string;
  action: "joined" | "left";
  timestamp: Date;
}

interface ParticipantSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalDuration: number; // in minutes
  joinCount: number;
  currentlyInMeeting: boolean;
  firstJoined: Date;
  lastActivity: Date;
}

export default function MeetingParticipation() {
  const params = useParams();
  const sessionId = params.sessionID as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingData, setMeetingData] = useState<{
    meetingId: string;
    meetingTitle: string;
    startTime: Date;
    endTime: Date | null;
    totalDuration: number;
  } | null>(null);
  const [events, setEvents] = useState<ParticipantEvent[]>([]);
  const [participantSummaries, setParticipantSummaries] = useState<
    ParticipantSummary[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParticipationData = async () => {
    try {
      setError(null);
      if (refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/sessions/${sessionId}/participation`);

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Session not found"
            : "Failed to fetch participation data"
        );
      }

      const data = await response.json();

      // Transform session data
      setMeetingData({
        meetingId: data.session.meetingId || "N/A",
        meetingTitle: data.session.meetingTitle || "Tutoring Session",
        startTime: new Date(data.session.startTime),
        endTime: data.session.endTime ? new Date(data.session.endTime) : null,
        totalDuration: data.session.totalDuration || 0,
      });

      // Transform events
      const transformedEvents: ParticipantEvent[] = data.events.map(
        (event: any) => ({
          id: event.id,
          participantId: event.participantId,
          name: event.name,
          email: event.email,
          action: event.action,
          timestamp: new Date(event.timestamp),
        })
      );
      setEvents(transformedEvents);

      // Transform participant summaries
      const transformedSummaries: ParticipantSummary[] =
        data.participantSummaries.map((summary: any) => ({
          id: summary.id,
          name: summary.name,
          email: summary.email,
          totalDuration: summary.totalDuration,
          joinCount: summary.joinCount,
          currentlyInMeeting: summary.currentlyInMeeting,
          firstJoined: new Date(summary.firstJoined),
          lastActivity: new Date(summary.lastActivity),
        }));
      setParticipantSummaries(transformedSummaries);
    } catch (err) {
      console.error("Error fetching participation data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load participation data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchParticipationData();
    }
  }, [sessionId]);

  const handleRefresh = () => {
    fetchParticipationData();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading && !meetingData) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">
                  {error || "Failed to load participation data"}
                </p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgDuration =
    participantSummaries.length > 0
      ? Math.round(
          participantSummaries.reduce((acc, p) => acc + p.totalDuration, 0) /
            participantSummaries.length
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Meeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{meetingData.meetingTitle}</h1>
          <p className="text-muted-foreground mt-1">
            Meeting ID: {meetingData.meetingId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Meeting Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatDuration(meetingData.totalDuration)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Total Participants
              </div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {participantSummaries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                Currently Active
              </div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {participantSummaries.filter((p) => p.currentlyInMeeting).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Avg. Duration</div>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatDuration(avgDuration)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participant Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Summary</CardTitle>
            <CardDescription>
              Total time spent by each participant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participantSummaries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No participants yet
              </p>
            ) : (
              participantSummaries.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={participant.avatar || "/placeholder.svg"}
                        alt={participant.name}
                      />
                      <AvatarFallback>
                        {participant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {participant.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          participant.currentlyInMeeting
                            ? "default"
                            : "secondary"
                        }
                      >
                        {participant.currentlyInMeeting ? "Active" : "Left"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDuration(participant.totalDuration)} •{" "}
                      {participant.joinCount} joins
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Complete history of joins and leaves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              ن{" "}
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet
                </p>
              ) : (
                events.map((event, index) => (
                  <div key={event.id}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${event.action === "joined" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {event.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.name}</span>
                          <Badge
                            variant={
                              event.action === "joined"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {event.action === "joined" ? (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" /> Joined
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 mr-1" /> Left
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                    </div>
                    {index < events.length - 1 && (
                      <Separator className="ml-6 mt-3" />
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
