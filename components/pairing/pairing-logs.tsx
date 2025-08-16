"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Users, UserCheck, AlertCircle, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

// Types based on your schemas
export type PairingStatus =
  | "pending"
  | "matched"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export type LogEntry = {
  id: string;
  timestamp: Date;
  type: "queue_entry" | "match_created" | "status_change";
  userType: "student" | "tutor";
  userId: string;
  userName: string;
  status: PairingStatus;
  details: string;
  matchId?: string;
  priority?: number;
};

// Mock data - replace with your actual data source
const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date("2025-01-15T10:30:00"),
    type: "queue_entry",
    userType: "student",
    userId: "user-123",
    userName: "Alice Johnson",
    status: "pending",
    details: "Student entered tutoring queue",
    priority: 1,
  },
  {
    id: "2",
    timestamp: new Date("2025-01-15T10:32:00"),
    type: "queue_entry",
    userType: "tutor",
    userId: "user-456",
    userName: "Bob Smith",
    status: "pending",
    details: "Tutor entered queue and available for matching",
  },
  {
    id: "3",
    timestamp: new Date("2025-01-15T10:33:00"),
    type: "match_created",
    userType: "student",
    userId: "user-123",
    userName: "Alice Johnson",
    status: "matched",
    details: "Matched with tutor Bob Smith",
    matchId: "match-789",
  },
  {
    id: "4",
    timestamp: new Date("2025-01-15T10:33:00"),
    type: "match_created",
    userType: "tutor",
    userId: "user-456",
    userName: "Bob Smith",
    status: "matched",
    details: "Matched with student Alice Johnson",
    matchId: "match-789",
  },
  {
    id: "5",
    timestamp: new Date("2025-01-15T10:35:00"),
    type: "status_change",
    userType: "tutor",
    userId: "user-456",
    userName: "Bob Smith",
    status: "accepted",
    details: "Tutor accepted the match",
    matchId: "match-789",
  },
  {
    id: "6",
    timestamp: new Date("2025-01-15T10:36:00"),
    type: "status_change",
    userType: "student",
    userId: "user-123",
    userName: "Alice Johnson",
    status: "accepted",
    details: "Student accepted the match",
    matchId: "match-789",
  },
];

const getStatusColor = (status: PairingStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "matched":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "declined":
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "completed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getTypeIcon = (type: LogEntry["type"]) => {
  switch (type) {
    case "queue_entry":
      return <Clock className="h-4 w-4" />;
    case "match_created":
      return <Users className="h-4 w-4" />;
    case "status_change":
      return <UserCheck className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export function PairingLogsTable() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    if (filterType !== "all" && log.type !== filterType) return false;
    if (filterUserType !== "all" && log.userType !== filterUserType)
      return false;
    if (filterStatus !== "all" && log.status !== filterStatus) return false;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (log.timestamp < fromDate) return false;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (log.timestamp > toDate) return false;
    }

    return true;
  });

  const stats = {
    total: logs.length,
    queueEntries: logs.filter((l) => l.type === "queue_entry").length,
    matches: logs.filter((l) => l.type === "match_created").length,
    statusChanges: logs.filter((l) => l.type === "status_change").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queueEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Matches Created
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Changes
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statusChanges}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Date Range Filter Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10 w-[180px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10 w-[180px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="queue_entry">Queue Entry</SelectItem>
                  <SelectItem value="match_created">Match Created</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User Type</label>
              <Select value={filterUserType} onValueChange={setFilterUserType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="tutor">Tutors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterType("all");
                  setFilterUserType("all");
                  setFilterStatus("all");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length} events)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Match ID</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No logs match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.type)}
                          <span className="capitalize">
                            {log.type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{log.userName}</div>
                          <Badge variant="outline" className="text-xs">
                            {log.userType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.details}>
                          {log.details}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.matchId || "-"}
                      </TableCell>
                      <TableCell>{log.priority || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
