'use client'
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllSessions, rescheduleSession } from "@/lib/actions/admin.actions";
import { toast } from "react-hot-toast";
import { Session } from '@/types';
import { getSessionTimespan } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

const Schedule = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [currentWeek]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);
      const weekStartString = weekStart.toISOString();
      const weekEndString = weekEnd.toISOString();

      const fetchedSessions = await getAllSessions(weekStartString, weekEndString);
      setSessions(fetchedSessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (sessionId: string, newDate: Date) => {
    try {
      const newDateString = newDate.toISOString();
      await rescheduleSession(sessionId, newDateString);
      toast.success("Session rescheduled successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to reschedule session:", error);
      toast.error("Failed to reschedule session");
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  });

  const goToPreviousWeek = () => setCurrentWeek(prevWeek => subWeeks(prevWeek, 1));
  const goToNextWeek = () => setCurrentWeek(prevWeek => addWeeks(prevWeek, 1));

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-left text-gray-800">Schedule</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={goToPreviousWeek} className="flex items-center">
            <ChevronLeft className="w-5 h-5 mr-2" /> Previous Week
          </Button>
          <h2 className="text-xl font-semibold text-gray-700">
            {format(weekDays[0], 'MMMM d, yyyy')} - {format(weekDays[6], 'MMMM d, yyyy')}
          </h2>
          <Button variant="outline" onClick={goToNextWeek} className="flex items-center">
            Next Week <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 animate-spin mx-auto text-blue-500" />
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border rounded-lg p-3 bg-gray-50">
                <h3 className="font-semibold mb-2 text-gray-700">{format(day, 'EEEE')}</h3>
                <p className="text-sm mb-4 text-gray-500">{format(day, 'MMM d')}</p>
                {sessions
                  .filter(session => format(parseISO(session.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                  .map(session => (
                    <Card 
                      key={session.id} 
                      className={`mb-2 ${session.status === 'Complete' ? 'bg-green-100' : 'bg-white'}`}
                    >
                      <CardContent className="p-3">
                        <p className="text-xs font-medium text-blue-800">Tutor: {session.tutor?.firstName} {session.tutor?.lastName}</p>
                        <p className="text-xs font-medium text-blue-600">Student: {session?.student?.firstName}</p>
                        <p className="text-xs text-gray-500">{session.summary}</p>
                        <p className="text-xs text-gray-500">{getSessionTimespan(session.date)}</p>
                        <p className="text-xs text-gray-400">Meeting ID: {session.meetingId}</p>
                        <Button 
                          className="mt-2 w-full text-xs h-6" 
                          onClick={() => handleReschedule(session.id, new Date())}
                          variant="outline"
                        >
                          Reschedule
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                {sessions.filter(session => format(parseISO(session.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length === 0 && (
                  <p className="text-sm text-gray-400 text-center">No sessions</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;