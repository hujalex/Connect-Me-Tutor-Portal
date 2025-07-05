"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Plus,
  Link as LinkIcon,
  Eye,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AvailabilityFormat from "@/components/student/AvailabilityFormat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfile } from "@/lib/actions/user.actions";
import { getTutorStudents } from "@/lib/actions/tutor.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";

const StudentList = () => {
  const supabase = createClientComponentClient();
  const [students, setStudents] = useState<Profile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Profile[]>([]); // New state for filtered students
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    const getTutorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw new Error(userError.message);
        if (!user) throw new Error("No user found");

        const profileData = await getProfile(user.id);
        if (!profileData) throw new Error("No profile found");

        setProfile(profileData);

        const studentsData = await getTutorStudents(profileData.id);
        if (!studentsData) throw new Error("No students found");

        setStudents(studentsData);
        setFilteredStudents(studentsData); // Initialize filteredStudents
      } catch (error) {
        console.error("Error fetching tutor data:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    getTutorData();
  }, [supabase.auth]);

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
        student.lastName.toLowerCase().includes(filterValue.toLowerCase())
    );
    setFilteredStudents(filtered); // Update filteredStudents instead of students
    setCurrentPage(1);
  }, [filterValue, students]);

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Students</h1>
      <div className="flex space-x-6">
        <div className="flex-grow bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Filter students..."
                className="w-64"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Parent Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.startDate}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>
                    <AvailabilityFormat availability={student.availability} />
                  </TableCell>
                  <TableCell className="flex flex-col">
                    {student.subjectsOfInterest?.map((item, index) => (
                      <span key={index}>{item}</span>
                    ))}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.parentPhone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-between items-center">
            <span>{filteredStudents.length} row(s) total.</span>
            <div className="flex items-center space-x-2">
              <span>Rows per page</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={handleRowsPerPageChange}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={rowsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentList;
