"use client";
import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  parseISO,
} from "date-fns";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  ChevronDown,
  Plus,
  Link as LinkIcon,
  Eye,
  RefreshCw,
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
import {
  getAllProfiles,
  addTutor,
  deactivateUser,
  reactivateUser,
  getEvents,
  getEventsWithTutorMonth,
  deleteUser,
  getUserFromId,
  editUser,
  resendEmailConfirmation,
} from "@/lib/actions/admin.actions";
import { getTutorSessions } from "@/lib/actions/tutor.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Session, Event } from "@/types";
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
import { Combobox } from "@/components/ui/combobox";

import AddTutorForm from "./components/AddTutorForm";
import DeleteTutorForm from "./components/DeleteTutorForm";
import EditTutorForm from "./components/EditTutorForm";

const TutorList = () => {
  const supabase = createClientComponentClient();
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTutor, setNewTutor] = useState<Partial<Profile>>({
    role: "Tutor",
    firstName: "",
    lastName: "",
    // dateOfBirth: "",
    startDate: "",
    availability: [],
    email: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    timeZone: "",
    subjects_of_interest: [],
    status: "Active",
    tutorIds: [],
  });
  const [selectedTutor, setSelectedTutor] = useState<Profile | null>(null);

  //---Modals
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [sessionsData, setSessionsData] = useState<{
    [key: string]: Session[];
  }>({});
  const [eventsData, setEventsData] = useState<{ [key: string]: Event[] }>({});
  const [allTimeHours, setAllTimeHours] = useState<{ [key: string]: number }>(
    {}
  );
  const [addingTutor, setAddingTutor] = useState(false);

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

      const tutorsData = await getAllProfiles("Tutor", "created_at", false);
      if (!tutorsData) throw new Error("No tutors found");

      setTutors(tutorsData);
      setFilteredTutors(tutorsData);
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
    getTutorData();
  }, [supabase.auth]);

  useEffect(() => {
    const filtered = tutors.filter((tutor) => {
      const searchTerm = filterValue.toLowerCase().trim();

      if (!searchTerm) return true;

      const tutorFirstName = tutor.firstName?.toLowerCase() || "";
      const tutorLastName = tutor.lastName?.toLowerCase() || "";
      const tutorEmail = tutor.email?.toLowerCase() || "";

      const fullName = `${tutorFirstName} ${tutorLastName}`.trim();

      return (
        tutorFirstName.includes(searchTerm) ||
        tutorLastName.includes(searchTerm) ||
        tutorEmail.includes(searchTerm) ||
        fullName.includes(searchTerm)
      );
    });
    setFilteredTutors(filtered);
    setCurrentPage(1);
  }, [filterValue, tutors]);

  const totalPages = Math.ceil(filteredTutors.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleTimeZone = (value: string) => {
    setNewTutor((prev) => ({ ...prev, timeZone: value }));
  };

  const handleTimeZoneForEdit = (value: string) => {
    setSelectedTutor((prev) =>
      prev ? ({ ...prev, timeZone: value } as Profile) : null
    );
  };

  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewTutor((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChangeForEdit = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setSelectedTutor((prev) =>
      prev ? ({ ...prev, [name]: value } as Profile) : null
    );
  };

  const handleAvailabilityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    setNewTutor((prev) => {
      const newAvailability = [...(prev.availability || [])];
      newAvailability[index] = { ...newAvailability[index], [name]: value };
      return { ...prev, availability: newAvailability };
    });
  };

  const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subjects = e.target.value.split(",").map((subject) => subject.trim());
    setNewTutor((prev) => ({ ...prev, subjectsOfInterest: subjects }));
  };

  const handleAddTutorWithParam = async (tutor: Partial<Profile>) => {
    try {
      setAddingTutor(true);
      // Ensure addStudent returns a Profile
      const addedTutor: Profile = await addTutor(tutor);

      // Update local state
      setTutors((prevTutors) => {
        // Check if addedStudent is valid
        if (addedTutor) {
          return [...prevTutors, addedTutor]; // Ensure returning an array of Profile
        }
        return prevTutors; // Return previous state if addedStudent is not valid
      });

      setFilteredTutors((prevFiltered) => {
        // Check if addedStudent is valid
        if (addedTutor) {
          return [...prevFiltered, addedTutor]; // Ensure returning an array of Profile
        }
        return prevFiltered; // Return previous state if addedStudent is not valid
      });

      if (addedTutor) {
        // Close modal and show success toast
        setIsModalOpen(false);
        setTutors((prevTutors) => [...prevTutors, addedTutor]);

        toast.success("Successfully added tutor.");

        // Reset form
        setNewTutor({
          role: "Tutor",
          firstName: "",
          lastName: "",
          // dateOfBirth: "",
          startDate: "",
          availability: [],
          email: "",
          parentName: "",
          parentPhone: "",
          parentEmail: "",
          timeZone: "",
          subjects_of_interest: [],
          status: "Active",
          tutorIds: [],
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error adding tutor:", error);
      toast.error(`Failed to add tutor ${err.message}`);
    } finally {
      setAddingTutor(false);
    }
  };

  const handleAddTutor = async () => {
    try {
      setAddingTutor(true);
      // Ensure addStudent returns a Profile
      const addedTutor: Profile = await addTutor(newTutor);

      // Update local state
      setTutors((prevTutors) => {
        // Check if addedStudent is valid
        if (addedTutor) {
          return [...prevTutors, addedTutor]; // Ensure returning an array of Profile
        }
        return prevTutors; // Return previous state if addedStudent is not valid
      });

      setFilteredTutors((prevFiltered) => {
        // Check if addedStudent is valid
        if (addedTutor) {
          return [...prevFiltered, addedTutor]; // Ensure returning an array of Profile
        }
        return prevFiltered; // Return previous state if addedStudent is not valid
      });

      if (addedTutor) {
        // Close modal and show success toast
        setIsModalOpen(false);
        setTutors((prevTutors) => [...prevTutors, addedTutor]);

        toast.success("Successfully added tutor.");

        // Reset form
        setNewTutor({
          role: "Tutor",
          firstName: "",
          lastName: "",
          // dateOfBirth: "",
          startDate: "",
          availability: [],
          email: "",
          parentName: "",
          parentPhone: "",
          parentEmail: "",
          timeZone: "",
          subjects_of_interest: [],
          status: "Active",
          tutorIds: [],
        });
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error adding tutor:", error);
      toast.error(`Failed to add tutor ${err.message}`);
    } finally {
      setAddingTutor(false);
    }
  };

  const handleResendEmailConfirmation = async () => {
    if (selectedTutor) {
      try {
        console.log("Resent Confirmation Email");
        console.log(selectedTutor.email);
        await resendEmailConfirmation(selectedTutor.email);
        toast.success("Resent Email Confirmation");
      } catch (error) {
        console.error("Failed to resend email confirmation", error);
        toast.error("Failed to resend email confirmation");
      }
    }
  };

  const handleDeleteTutor = async () => {
    if (selectedTutorId) {
      try {
        await deleteUser(selectedTutorId);
        toast.success("Tutor deleted successfully");
        setSelectedTutorId(null);
        getTutorData();
      } catch (error) {
        toast.error("Failed to delete Tutor");
      }
    }
  };

  const handleDeactivateTutor = async () => {
    if (selectedTutorId) {
      try {
        const data = await deactivateUser(selectedTutorId); // Call deactivateUser function with studentId
        if (data) {
          toast.success("Tutor deactivated successfully");
          setSelectedTutorId(null);
          getTutorData();
        }
      } catch (error) {
        toast.error("Failed to deactivate tutor");
      }
    }
  };

  const handleGetSelectedTutor = async (profileId: string | null) => {
    if (profileId) {
      try {
        const data = await getUserFromId(profileId);
        setSelectedTutor(data as unknown as Profile);
        // setIsReactivateModalOpen(false);
      } catch (error) {
        console.error("Failed to identify tutor");
      }
    }
  };

  const handleEditTutor = async () => {
    if (selectedTutor) {
      try {
        await editUser(selectedTutor);
        toast.success("Tutor Edited Succesfully");
        setIsEditModalOpen(false);
        setSelectedTutor(null);
        getTutorData();
      } catch (error) {
        toast.error("Failed to edit tutor");
      }
    }
  };

  const handleReactivateTutor = async () => {
    if (selectedTutorId) {
      try {
        const data = await reactivateUser(selectedTutorId); // Call deactivateUser function with studentId
        if (data) {
          toast.success("Tutor reactivated successfully");
          setIsReactivateModalOpen(false);
          setSelectedTutorId(null);
          getTutorData();
        }
      } catch (error) {
        toast.error("Failed to deactivate student");
      }
    }
  };

  const fetchSessionsAndEvents = async () => {
    let selectedDate = new Date();
    const sessionsPromises = tutors.map((tutor) =>
      getTutorSessions(
        tutor.id,
        startOfMonth(selectedDate).toISOString(),
        endOfMonth(selectedDate).toISOString()
      )
    );
    const eventsPromises = tutors.map((tutor) =>
      getEventsWithTutorMonth(
        tutor?.id,
        startOfMonth(selectedDate).toISOString()
      )
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

  useEffect(() => {
    if (tutors.length > 0) {
      fetchSessionsAndEvents();
      calculateAllTimeHours();
    }
  }, [tutors]);

  const calculateAllTimeHours = async () => {
    const allTimeHoursPromises = tutors.map(async (tutor) => {
      const allSessions = await getTutorSessions(tutor.id);
      const allEvents = await getEvents(tutor.id);

      const sessionHours = allSessions
        .filter((session) => session.status === "Complete")
        .reduce(
          (total, session) => total + calculateSessionDuration(session),
          0
        );

      const eventHours =
        allEvents?.reduce((total, event) => total + event?.hours, 0) || 0;

      return { tutorId: tutor.id, hours: sessionHours + eventHours };
    });

    try {
      const results = await Promise.all(allTimeHoursPromises);
      const newAllTimeHours: { [key: string]: number } = {};
      results.forEach((result) => {
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
    let sessionDuration = 1.5;
    end.setMinutes(end.getMinutes() + sessionDuration);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">All Tutors</h1>

      <div className="flex space-x-6">
        <div className="flex-grow bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Filter tutors..."
                className="w-64"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
              {/*Add Student*/}
              <AddTutorForm
                newTutor={newTutor}
                setNewTutor={setNewTutor}
                addingTutor={addingTutor}
                handleInputChange={handleInputChange}
                handleAddTutor={handleAddTutorWithParam}
                handleTimeZone={handleTimeZone}
              />
              {/*Delete Student*/}
              <DeleteTutorForm
                tutors={tutors}
                selectedTutorId={selectedTutorId}
                setSelectedTutorId={setSelectedTutorId}
                handleDeleteTutor={handleDeleteTutor}
              />

              {/*Reactivate Student*/}
              <EditTutorForm
                isReactivateModalOpen={isReactivateModalOpen}
                setIsReactivateModalOpen={setIsReactivateModalOpen}
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                tutors={tutors}
                selectedTutor={selectedTutor}
                selectedTutorId={selectedTutorId}
                setSelectedTutorId={setSelectedTutorId}
                handleEditTutor={handleEditTutor}
                handleGetSelectedTutor={handleGetSelectedTutor}
                handleInputChangeForEdit={handleInputChangeForEdit}
                handleTimeZoneForEdit={handleTimeZoneForEdit}
              />
              {/*Edit Page*/}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Tutor Name</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Subjects Teaching </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTutors.map((tutor, index) => (
                <TableRow key={index}>
                  <TableCell>{tutor.status}</TableCell>
                  <TableCell>{tutor.startDate}</TableCell>
                  <TableCell>
                    {tutor.firstName} {tutor.lastName}
                  </TableCell>
                  <TableCell>
                    <AvailabilityFormat availability={tutor.availability} />
                  </TableCell>
                  <TableCell className="flex flex-col">
                    {tutor.subjects_of_interest?.map((item, index) => (
                      <span key={index}>{item}</span>
                    ))}
                  </TableCell>
                  <TableCell>{tutor.email}</TableCell>
                  <TableCell>
                    {allTimeHours[tutor.id]?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        {" "}
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {" "}
                            Resend Confirmation Email for {tutor.firstName}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Note: Will not resend confirmation email if the user
                            has already signed in before
                          </AlertDialogDescription>
                        </AlertDialogHeader>{" "}
                        <AlertDialogFooter>
                          {" "}
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              resendEmailConfirmation(tutor.email)
                                .then(() => {
                                  toast.success("Resent Email Confirmation");
                                })
                                .catch(() => {
                                  toast.error(
                                    "Failed to resend email confirmation"
                                  );
                                });
                            }}
                          >
                            Resend
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-between items-center">
            <span>{filteredTutors.length} row(s) total.</span>
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

export default TutorList;
