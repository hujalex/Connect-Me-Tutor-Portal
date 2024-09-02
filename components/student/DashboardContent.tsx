import React, { useState } from 'react';
import { Bell, ChevronDown, Plus, Link as LinkIcon, Eye, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/ui/sidebar';
import StudentCalendar from './StudentCalendar';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
    { date: '03/12/2024', title: 'Mathematics Tutoring Session 101', tutor: 'Mariah Carey', link: 'www.zoom...' },
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            <span className="font-semibold">Beyonce Knowles</span>
            <ChevronDown size={20} />
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Input type="text" placeholder="Search..." className="w-64" />
            <img src="/api/placeholder/32/32" alt="User" className="w-8 h-8 rounded-full" />
          </div>
        </header>

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
          
          <div className="flex space-x-6">
            <div className="flex-grow bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <Input type="text" placeholder="Filter sessions..." className="w-64" />
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Tutor
                  </Button>
                  <Button variant="outline">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Link
                  </Button>
                </div>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"><Input type="checkbox" /></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell><Input type="checkbox" /></TableCell>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.title}</TableCell>
                      <TableCell>{session.tutor}</TableCell>
                      <TableCell>{session.link}</TableCell>
                      <TableCell>...</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-between items-center">
                <span>0 of 100 row(s) selected.</span>
                <div className="flex items-center space-x-2">
                  <span>Rows per page</span>
                  <Select defaultValue="10">
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>Page 1 of 10</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon"><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><ChevronsRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-80">
              <StudentCalendar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;