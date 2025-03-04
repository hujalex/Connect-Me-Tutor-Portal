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
import { Combobox } from "@/components/ui/combobox";
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
import {
  getAllProfiles,
  addStudent,
  deactivateUser,
  reactivateUser,
  deleteUser,
  editUser,
  getUserFromId,
} from "@/lib/actions/admin.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from "react-hot-toast";
import { set } from "date-fns";

const getOrdinalSuffix = (num: number): string => {
  if (num === 1) return "st";
  if (num === 2) return "nd";
  if (num === 3) return "rd";
  return "th";
};

const StudentList = () =>
  //   {
  //   isOpen,
  //   onOpenChange,
  //   onDeactivate,
  // }: {
  //   isOpen: boolean;
  //   onOpenChange: (open: boolean) => void;
  //   students: Array<{
  //     id: string;
  //     firstName: string;
  //     lastName: string;
  //     status: string;
  //   }>;
  //   onDeactivate: (studentId: string) => void;
  // }
  {
    const supabase = createClientComponentClient();
    const [students, setStudents] = useState<Profile[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Profile[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterValue, setFilterValue] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState<Partial<Profile>>({
      role: "Student",
      age: "",
      grade: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      startDate: "",
      availability: [],
      email: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      timeZone: "",
      subjectsOfInterest: [],
      status: "Active",
      tutorIds: [],
      studentNumber: "",
    });
    const [selectedStudent, setSelectedStudent] = useState<Profile | null>(
      null
    );

    //---Modals
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
      null
    );
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [addingStudent, setAddingStudent] = useState(false);

    const getStudentData = async () => {
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

        const studentsData = await getAllProfiles(
          "Student",
          "created_at",
          false
        );
        if (!studentsData) throw new Error("No students found");

        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (error) {
        console.error("Error fetching tutor data:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      getStudentData();
    }, [supabase.auth, students]);

    useEffect(() => {
      const filtered = students.filter(
        (student) =>
          student.firstName
            ?.toLowerCase()
            .includes(filterValue.toLowerCase()) ||
          student.lastName?.toLowerCase().includes(filterValue.toLowerCase())
      );
      setFilteredStudents(filtered);
      setCurrentPage(1);
    }, [filterValue, students]);

    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

    const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
    };

    const handleAgeChange = (value: string) => {
      setNewStudent((prev) => ({ ...prev, age: value }));
    };

    const handleAgeChangeForEdit = (value: string) => {
      setSelectedStudent((prev) =>
        prev ? ({ ...prev, age: value } as Profile) : null
      );
    };

    const handleGradeChange = (value: string) => {
      setNewStudent((prev) => ({ ...prev, grade: value }));
    };

    const handleGradeChangeForEdit = (value: string) => {
      setSelectedStudent((prev) => ({ ...prev, grade: value } as Profile));
    };

    const handleTimeZone = (value: string) => {
      setNewStudent((prev) => ({ ...prev, timeZone: value }));
    };

    const handleTimeZoneForEdit = (value: string) => {
      setSelectedStudent((prev) =>
        prev ? ({ ...prev, timeZone: value } as Profile) : null
      );
    };

    const handleRowsPerPageChange = (value: string) => {
      setRowsPerPage(parseInt(value));
      setCurrentPage(1);
    };

    const paginatedStudents = filteredStudents.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setNewStudent((prev) => ({ ...prev, [name]: value }));
    };

    const handleInputChangeForEdit = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setSelectedStudent((prev) =>
        prev ? ({ ...prev, [name]: value } as Profile) : null
      );
    };

    const handleAvailabilityChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      index: number
    ) => {
      const { name, value } = e.target;
      setNewStudent((prev) => {
        const newAvailability = [...(prev.availability || [])];
        newAvailability[index] = { ...newAvailability[index], [name]: value };
        return { ...prev, availability: newAvailability };
      });
    };

    const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const subjects = e.target.value
        .split(",")
        .map((subject) => subject.trim());
      setNewStudent((prev) => ({ ...prev, subjectsOfInterest: subjects }));
    };

    const handleSubjectsChangeForEdit = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const subjects = e.target.value
        .split(",")
        .map((subject) => subject.trim());
      setSelectedStudent(
        (prev) => ({ ...prev, subjectsOfInterest: subjects } as Profile)
      );
    };

    const handleAddStudent = async () => {
      try {
        setAddingStudent(true);
        // Ensure addStudent returns a Profile
        const addedStudent: Profile = await addStudent(newStudent);

        // Update local state
        setStudents((prevStudents) => {
          // Check if addedStudent is valid
          if (addedStudent) {
            return [...prevStudents, addedStudent]; // Ensure returning an array of Profile
          }
          return prevStudents; // Return previous state if addedStudent is not valid
        });

        setFilteredStudents((prevFiltered) => {
          // Check if addedStudent is valid
          if (addedStudent) {
            return [...prevFiltered, addedStudent]; // Ensure returning an array of Profile
          }
          return prevFiltered; // Return previous state if addedStudent is not valid
        });

        if (addedStudent) {
          // Close modal and show success toast
          setIsModalOpen(false);
          setStudents((prevStudents) => [...prevStudents, addedStudent]);

          toast.success("Successfully added student.");

          // Reset form
          setNewStudent({
            role: "Student",
            age: "",
            grade: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            startDate: "",
            availability: [],
            email: "",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            timeZone: "",
            subjectsOfInterest: [],
            status: "Active",
            tutorIds: [],
          });
        }
      } catch (error) {
        const err = error as Error;
        console.error("Error adding student:", error);
        toast.error("Failed to Add Student.");
        toast.error(`${err.message}`);
      } finally {
        setAddingStudent(false);
      }
    };

    const handleDeleteStudent = async () => {
      if (selectedStudentId) {
        try {
          await deleteUser(selectedStudentId);
          toast.success("Student deleted successfully");
          setIsDeactivateModalOpen(false);
          setSelectedStudentId(null);
          getStudentData();
        } catch (error) {
          toast.error("Failed to delete student");
        }
      }
    };

    //----Deprecated--->
    const handleDeactivateStudent = async () => {
      if (selectedStudentId) {
        try {
          const data = await deactivateUser(selectedStudentId); // Call deactivateUser function with studentId
          if (data) {
            toast.success("Student deactivated successfully");
            setIsDeactivateModalOpen(false);
            setSelectedStudentId(null);
            getStudentData();
          }
        } catch (error) {
          toast.error("Failed to deactivate student");
        }
      }
    };
    //<---

    const handleGetSelectedStudent = async (profileId: string | null) => {
      if (profileId) {
        try {
          const data = await getUserFromId(profileId);
          setSelectedStudent(data);
          // setIsReactivateModalOpen(false);
        } catch (error) {
          console.error("Failed to identify tutor");
        }
      }
    };

    const handleEditStudent = async () => {
      if (selectedStudent) {
        try {
          await editUser(selectedStudent);
          toast.success("Tutor Edited Succesfully");
          setIsEditModalOpen(false);
          setSelectedStudent(null);
          getStudentData();
        } catch (error) {
          toast.error("Failed to edit tutor");
        }
      }
    };

    const handleReactivateStudent = async () => {
      if (selectedStudentId) {
        try {
          const data = await reactivateUser(selectedStudentId); // Call deactivateUser function with studentId
          if (data) {
            toast.success("Student reactivated successfully");
            setIsReactivateModalOpen(false);
            setSelectedStudentId(null);
            getStudentData();
          }
        } catch (error) {
          toast.error("Failed to deactivate student");
        }
      }
    };

    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-6">All Students</h1>

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
                {/*Add Student*/}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Student</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="studentNumber" className="text-right">
                          Student #
                        </Label>
                        <Input
                          id="studentNumber"
                          name="studentNumber"
                          value={newStudent.studentNumber ?? ""}
                          onChange={handleInputChange}
                          className="col-span-3"
                        ></Input>
                      </div>
                      <div className="grid grid-cols-8 items-center gap-4">
                        <Label htmlFor="age" className="text-right col-span-2">
                          Age
                        </Label>
                        <div className="col-span-2">
                          <Input
                            id="age"
                            name="age"
                            value={newStudent.age}
                            onChange={handleInputChange}
                            className="col-span-3"
                          ></Input>
                        </div>
                        <Label htmlFor="grade" className="text-right">
                          Grade
                        </Label>
                        <div className="col-span-3">
                          <Select
                            name="grade"
                            value={newStudent.grade}
                            onValueChange={handleGradeChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Kindergarten">
                                Kindergarten
                              </SelectItem>
                              <SelectItem value="Kindergarten">K</SelectItem>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem
                                  key={i}
                                  value={`${i + 1}${getOrdinalSuffix(
                                    i + 1
                                  )}-grade`}
                                >
                                  {`${i + 1}${getOrdinalSuffix(i + 1)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={newStudent.firstName}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={newStudent.lastName}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newStudent.email}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dateOfBirth" className="text-right">
                          Date of Birth
                        </Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={newStudent.dateOfBirth}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">
                          Start Date
                        </Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={newStudent.startDate}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parentName" className="text-right">
                          Parent Name
                        </Label>
                        <Input
                          id="parentName"
                          name="parentName"
                          value={newStudent.parentName}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parentPhone" className="text-right">
                          Parent Phone
                        </Label>
                        <Input
                          id="parentPhone"
                          name="parentPhone"
                          value={newStudent.parentPhone}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="parentEmail" className="text-right">
                          Parent Email
                        </Label>
                        <Input
                          id="parentEmail"
                          name="parentEmail"
                          type="email"
                          value={newStudent.parentEmail}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="timeZone" className="text-right">
                          Time Zone
                        </Label>
                        <div className="col-span-3">
                          <Select
                            name="timeZone"
                            value={newStudent.timeZone}
                            onValueChange={handleTimeZone}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EST">EST</SelectItem>
                              <SelectItem value="CST">CST</SelectItem>
                              <SelectItem value="MT">MT</SelectItem>
                              <SelectItem value="PST">PST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="subjectsOfInterest"
                          className="text-right"
                        >
                          Subjects of Interest
                        </Label>
                        <Input
                          id="subjectsOfInterest"
                          name="subjectsOfInterest"
                          value={newStudent.subjectsOfInterest?.join(", ")}
                          onChange={handleSubjectsChange}
                          className="col-span-3"
                        />
                      </div>
                      {/* Add more fields for availability if needed */}
                    </div>
                    <Button onClick={handleAddStudent} disabled={addingStudent}>
                      {addingStudent ? "Adding Student..." : "Add Student"}
                    </Button>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Student</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Select a Student to Delete</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Label htmlFor="studentSelect" className="text-right">
                        Student
                      </Label>
                      <div className="relative">
                        <Combobox
                          list={students
                            // .filter((student) => student.status === "Active")
                            .map((student) => ({
                              value: student.id,
                              label: `${student.firstName} ${student.lastName}`,
                            }))}
                          category="student"
                          onValueChange={setSelectedStudentId}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleDeleteStudent}
                      disabled={!selectedStudentId}
                      className="w-full"
                    >
                      Confirm Deletion
                    </Button>
                  </DialogContent>
                </Dialog>
                {/*Reactivate Student*/}
                <Dialog
                  open={isReactivateModalOpen}
                  onOpenChange={setIsReactivateModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-500">Edit Student</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Select a Student to Edit</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Label htmlFor="studentSelect" className="text-right">
                        Student
                      </Label>
                      <div className="relative">
                        <Combobox
                          list={students
                            // .filter((student) => student.status === "Inactive")
                            .map((student) => ({
                              value: student.id,
                              label: `${student.firstName} ${student.lastName}`,
                            }))}
                          category="student"
                          onValueChange={setSelectedStudentId}
                        />
                      </div>
                    </div>
                    <Dialog
                      open={isEditModalOpen}
                      onOpenChange={setIsEditModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          disabled={!selectedStudentId}
                          onClick={() =>
                            handleGetSelectedStudent(selectedStudentId)
                          }
                        >
                          Select Student to edit
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Student</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="studentNumber"
                              className="text-right"
                            >
                              Student #
                            </Label>
                            <Input
                              id="studentNumber"
                              name="studentNumber"
                              value={selectedStudent?.studentNumber ?? ""}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            ></Input>
                          </div>
                          <div className="grid grid-cols-8 items-center gap-4">
                            <Label
                              htmlFor="age"
                              className="text-right col-span-2"
                            >
                              Age
                            </Label>
                            <div className="col-span-2">
                              <Input
                                id="age"
                                name="age"
                                value={selectedStudent?.age}
                                onChange={handleInputChangeForEdit}
                                className="col-span-3"
                              ></Input>
                            </div>
                            <Label htmlFor="grade" className="text-right">
                              Grade
                            </Label>
                            <div className="col-span-3">
                              <Select
                                name="grade"
                                value={selectedStudent?.grade}
                                onValueChange={handleGradeChangeForEdit}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Kindergarten">
                                    Kindergarten
                                  </SelectItem>
                                  <SelectItem value="Kindergarten">
                                    K
                                  </SelectItem>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem
                                      key={i}
                                      value={`${i + 1}${getOrdinalSuffix(
                                        i + 1
                                      )}-grade`}
                                    >
                                      {`${i + 1}${getOrdinalSuffix(i + 1)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              value={selectedStudent?.firstName}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              value={selectedStudent?.lastName}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={selectedStudent?.email}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dateOfBirth" className="text-right">
                              Date of Birth
                            </Label>
                            <Input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={selectedStudent?.dateOfBirth}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startDate" className="text-right">
                              Start Date
                            </Label>
                            <Input
                              id="startDate"
                              name="startDate"
                              type="date"
                              value={selectedStudent?.startDate}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="parentName" className="text-right">
                              Parent Name
                            </Label>
                            <Input
                              id="parentName"
                              name="parentName"
                              value={selectedStudent?.parentName}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="parentPhone" className="text-right">
                              Parent Phone
                            </Label>
                            <Input
                              id="parentPhone"
                              name="parentPhone"
                              value={selectedStudent?.parentPhone}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="parentEmail" className="text-right">
                              Parent Email
                            </Label>
                            <Input
                              id="parentEmail"
                              name="parentEmail"
                              type="email"
                              value={selectedStudent?.parentEmail}
                              onChange={handleInputChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="timeZone" className="text-right">
                              Time Zone
                            </Label>
                            <div className="col-span-3">
                              <Select
                                name="timeZone"
                                value={selectedStudent?.timeZone}
                                onValueChange={handleTimeZoneForEdit}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EST">EST</SelectItem>
                                  <SelectItem value="CST">CST</SelectItem>
                                  <SelectItem value="MT">MT</SelectItem>
                                  <SelectItem value="PST">PST</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="subjectsOfInterest"
                              className="text-right"
                            >
                              Subjects of Interest
                            </Label>
                            <Input
                              id="subjectsOfInterest"
                              name="subjectsOfInterest"
                              value={selectedStudent?.subjectsOfInterest?.join(
                                ", "
                              )}
                              onChange={handleSubjectsChangeForEdit}
                              className="col-span-3"
                            />
                          </div>
                          {/* Add more fields for availability if needed */}
                        </div>
                        <Button onClick={handleEditStudent}>
                          Finish editing student
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Subjects Learning</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Parent Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>{student.status}</TableCell>
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
        <Toaster />
      </main>
    );
  };

export default StudentList;
