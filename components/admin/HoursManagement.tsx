'use client'
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, parseISO } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllProfiles, getEvents, getEventsWithTutorMonth, createEvent, removeEvent } from "@/lib/actions/admin.actions";
import { getTutorSessions } from "@/lib/actions/tutor.actions";
import { Profile, Session, Event } from '@/types';
import { toast, Toaster } from "react-hot-toast";

const HoursManager = () => {
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessionsData, setSessionsData] = useState<{ [key: string]: Session[] }>({});
  const [eventsData, setEventsData] = useState<{ [key: string]: Event[] }>({});
  const [allTimeHours, setAllTimeHours] = useState<{ [key: string]: number }>({});
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isRemoveEventModalOpen, setIsRemoveEventModalOpen] = useState(false);
  const [selectedTutorForEvent, setSelectedTutorForEvent] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({});
  const [eventsToRemove, setEventsToRemove] = useState<Event[]>([]);
  const [selectedEventToRemove, setSelectedEventToRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchTutors();
  }, []);

  useEffect(() => {
    if (tutors.length > 0) {
      fetchSessionsAndEvents();
      calculateAllTimeHours();
    }
  }, [tutors, selectedDate]);

  const fetchTutors = async () => {
    try {
      const fetchedTutors = await getAllProfiles("Tutor");
      if (fetchedTutors) {
        setTutors(fetchedTutors);
      }
    } catch (error) {
      console.error("Failed to fetch tutors:", error);
    }
  };

  const fetchSessionsAndEvents = async () => {
    const sessionsPromises = tutors.map(tutor => 
      getTutorSessions(tutor.id, startOfMonth(selectedDate).toISOString(), endOfMonth(selectedDate).toISOString())
    );
    const eventsPromises = tutors.map(tutor => 
        getEventsWithTutorMonth(tutor?.id, startOfMonth(selectedDate).toISOString())
    );

    try {
      const sessionsResults = await Promise.all(sessionsPromises);
      const eventsResults = await Promise.all(eventsPromises);

      const newSessionsData: { [key: string]: Session[] } = {};
      const newEventsData: { [key: string]: Event[] } = {};

      tutors.forEach((tutor, index) => {
        newSessionsData[tutor.id] = sessionsResults[index];
        if (eventsResults[index]) {
            newEventsData[tutor.id] = eventsResults[index];
        }
      });

      setSessionsData(newSessionsData);
      setEventsData(newEventsData);
    } catch (error) {
      console.error("Failed to fetch sessions or events:", error);
    }
  };

  const calculateAllTimeHours = async () => {
    const allTimeHoursPromises = tutors.map(async tutor => {
      const allSessions = await getTutorSessions(tutor.id);
      const allEvents = await getEvents(tutor.id);

      const sessionHours = allSessions
        .filter(session => session.status === 'Complete')
        .reduce((total, session) => total + calculateSessionDuration(session), 0);

      const eventHours = allEvents?.reduce((total, event) => total + event?.hours, 0) || 0;

      return { tutorId: tutor.id, hours: (sessionHours * 1.5) + eventHours };
    });

    try {
      const results = await Promise.all(allTimeHoursPromises);
      const newAllTimeHours: { [key: string]: number } = {};
      results.forEach(result => {
        newAllTimeHours[result.tutorId] = result.hours;
      });
      setAllTimeHours(newAllTimeHours);
    } catch (error) {
      console.error("Failed to calculate all-time hours:", error);
    }
  };

  const calculateSessionDuration = (session: Session) => {
    const start = new Date(session.date);
    const end = new Date(session.date);
    let sessionDuration = 1.5
    end.setMinutes(end.getMinutes() + sessionDuration);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
  };

  const calculateWeeklyHours = (tutorId: string, weekStart: Date, weekEnd: Date) => {
    return sessionsData[tutorId]
      ?.filter(session => 
        session.status === 'Complete' &&
        new Date(session.date) >= weekStart &&
        new Date(session.date) < weekEnd
      )
      .reduce((total, session) => total + calculateSessionDuration(session), 0) || 0;
  };

  const calculateExtraHours = (tutorId: string) => {
    return eventsData[tutorId]?.reduce((total, event) => total + event.hours, 0) || 0;
  };

  const calculateMonthHours = (tutorId: string) => {
    const sessionHours = sessionsData[tutorId]
      ?.filter(session => session.status === 'Complete')
      .reduce((total, session) => total + calculateSessionDuration(session), 0) || 0;
    const extraHours = calculateExtraHours(tutorId);
    return sessionHours + extraHours;
  };

  const weeksInMonth = eachWeekOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  const monthYearOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  });

  const handleAddEvent = async () => {
    if (newEvent.tutorId && newEvent.date && newEvent.hours && newEvent.summary) {
      try {
        await createEvent(newEvent as Event);
        toast.success("Event added successfully.");
        setIsAddEventModalOpen(false);
        setNewEvent({});
        fetchSessionsAndEvents();
      } catch (error) {
        console.error("Failed to add event:", error);
        toast.error("Failed to add event");
      }
    } else {
      toast.error("Please fill all fields");
    }
  };

  const handleRemoveEvent = async () => {
    if (selectedEventToRemove) {
      try {
        await removeEvent(selectedEventToRemove);
        toast.success("Event removed successfully. Refresh to view update.");
        setIsRemoveEventModalOpen(false);
        setSelectedEventToRemove(null);
        fetchSessionsAndEvents();
      } catch (error) {
        console.error("Failed to remove event:", error);
        toast.error("Failed to remove event");
      }
    } else {
      toast.error("Please select an event to remove");
    }
  };

  return (
    <main className="p-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">Hours Manager</h1>
      </div>
      <div>
        <div className="overflow-x-auto flex-grow bg-white rounded-lg shadow p-6">
            <div className="flex justify-end items-center">
                <div className="flex space-x-4">
                    <Select
                    onValueChange={(value) => setSelectedDate(new Date(value))}
                    defaultValue={selectedDate.toISOString()}
                    >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthYearOptions.map((date) => (
                        <SelectItem key={date.toISOString()} value={date.toISOString()}>
                            {format(date, 'MMMM yyyy')}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <Dialog open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsAddEventModalOpen(true)}>Add Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Add New Event</DialogTitle>
                        </DialogHeader>
                        <Select onValueChange={(value) => setNewEvent({ ...newEvent, tutorId: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Tutor" />
                        </SelectTrigger>
                        <SelectContent>
                            {tutors.map((tutor) => (
                            <SelectItem key={tutor.id} value={tutor.id}>
                                {tutor.firstName} {tutor.lastName}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Input
                        type="date"
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        placeholder="Date"
                        />
                        <Input
                        type="number"
                        onChange={(e) => setNewEvent({ ...newEvent, hours: parseFloat(e.target.value) })}
                        placeholder="Hours"
                        />
                        <Input
                        type="text"
                        onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                        placeholder="Summary"
                        />
                        <Button onClick={handleAddEvent}>Add Event</Button>
                    </DialogContent>
                    </Dialog>
                    <Dialog open={isRemoveEventModalOpen} onOpenChange={setIsRemoveEventModalOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsRemoveEventModalOpen(true)}>Remove Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Remove Event</DialogTitle>
                        </DialogHeader>
                        <Select onValueChange={(value) => {
                        setSelectedTutorForEvent(value);
                        setEventsToRemove(eventsData[value] || []);
                        }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Tutor" />
                        </SelectTrigger>
                        <SelectContent>
                            {tutors.map((tutor) => (
                            <SelectItem key={tutor.id} value={tutor.id}>
                                {tutor.firstName} {tutor.lastName}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        {selectedTutorForEvent && (
                        <Select onValueChange={(value) => setSelectedEventToRemove(value)}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select Event to Remove" />
                            </SelectTrigger>
                            <SelectContent>
                            {eventsToRemove.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                {format(parseISO(event.date), 'yyyy-MM-dd')} - {event.summary}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                        <Button onClick={handleRemoveEvent}>Remove Event</Button>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>
          
          <Table>
          <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-white">Tutor Name</TableHead>
                {weeksInMonth.map((week, index) => (
                  <TableHead key={week.toISOString()}>
                    
                    {format(week, 'MMM d')} - {format(new Date(week.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM d')}
                  </TableHead>
                ))}
                <TableHead>Added</TableHead>
                <TableHead>This Month</TableHead>
                <TableHead>All Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutors.map((tutor) => (
                <TableRow key={tutor.id}>
                  <TableCell className="sticky left-0 z-10 bg-white">{tutor.firstName} {tutor.lastName}</TableCell>
                  {weeksInMonth.map((week) => (
                    <TableCell key={week.toISOString()}>
                      {calculateWeeklyHours(tutor.id, week, new Date(week.getTime() + 7 * 24 * 60 * 60 * 1000)).toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell>{calculateExtraHours(tutor.id).toFixed(2)}</TableCell>
                  <TableCell>{calculateMonthHours(tutor.id).toFixed(2)}</TableCell>
                  <TableCell>{allTimeHours[tutor.id]?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Toaster/>
    </main>
  );
};

export default HoursManager;