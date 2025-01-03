"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getAllProfiles,
  addTutor,
  deactivateUser,
  reactivateUser,
  getEvents,
  getEventsWithTutorMonth,
  addStudent,
} from "@/lib/actions/admin.actions";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  analyzeAndTransformStudents,
  migrateSelectedStudents,
  type Profile,
} from "@/lib/actions/migrate.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Papa from "papaparse";
import { string } from "zod";
import internal from "stream";

// const migratedTutor: Profile = {
//   role: "Tutor",
//   firstName: "",
//   lastName: "",
//   dateOfBirth: "",
//   startDate: "",
//   availability: [],
//   email: "",
//   parentName: "",
//   parentPhone: "",
//   parentEmail: "",
//   timeZone: "",
//   subjectsOfInterest: [],
//   status: "Active",
//   tutorIds: [],
// };

export default function MigrateDataPage() {
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erroredTutorEntries, setErroredTutorEntries] = useState<Profile[]>([]);
  const [erroredStudentEntries, setErroredStudentEntries] = useState<Profile[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set()
  );
  const [selectedTutors, setSelectedTutors] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [migrationStatus, setMigrationStatus] = useState("");
  const [userOption, setUserOption] = useState(false);
  const [showErrorEntries, setShowErrorEntries] = useState(false);
  const [revealErrorEntries, setRevealErrorEntries] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(students?.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentStudents = students?.slice(startIndex, endIndex);
  const currentTutors = tutors?.slice(startIndex, endIndex);

  const col_idx = {
    "Tutor Name": 1,
    "Student Name": 2,
    "Tutor Email": 3,
    "Student Email": 4,
    "Day of the Week": 5,
    "Session Time": 6,
    "Zoom Link": 7,
  };

  const formatAvailability = (
    availability: Profile["availability"]
  ): string => {
    return availability
      .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
      .join(", ");
  };

  const toggleSelectStudent = (index: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectTutor = (index: number) => {
    const newSelected = new Set(selectedTutors);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTutors(newSelected);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const parseNames = (name: string) => {
    if (!name.trim()) {
      return ["", ""];
    }
    const words_in_name = name.split(" ");
    if (words_in_name.length > 1) {
      return [words_in_name[0], words_in_name[words_in_name.length - 1]];
    }
    return [words_in_name[0], ""];
  };

  const handleMigrateStudents = async (len: number, data: any) => {
    const students: Profile[] = [];
    const errors: Profile[] = [];

    for (let i = 0; i < len; ++i) {
      const entry = data.at(3) as string[];

      const migratedProfile: Profile = {
        role: "Student",
        firstName: parseNames(entry[col_idx["Student Name"]])[0],
        lastName: parseNames(entry[col_idx["Student Name"]])[1],
        dateOfBirth: "01/11/1111",
        startDate: "01/11/1111",
        availability: [],
        email: entry[col_idx["Student Email"]],
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        timeZone: "",
        subjectsOfInterest: [],
        status: "Active",
        tutorIds: [],
        id: "",
        createdAt: "",
        userId: "",
      };
      try {
        students.push(migratedProfile);
      } catch (error) {
        errors.push(migratedProfile);
        console.error(`Error for row ${i}`);
      }
    }
    setStudents(students);
    setErroredStudentEntries(errors);
  };

  const handleMigrateTutors = async (len: number, data: any) => {
    const tutors: Profile[] = [];
    const errors: Profile[] = [];

    for (let i = 0; i < len; ++i) {
      const entry = data.at(3) as string[];

      const migratedProfile: Profile = {
        role: "Tutor",
        firstName: parseNames(entry[col_idx["Tutor Name"]])[0],
        lastName: parseNames(entry[col_idx["Tutor Name"]])[1],
        dateOfBirth: "01/11/1111",
        startDate: "01/11/1111",
        availability: [],
        email: entry[col_idx["Tutor Email"]],
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        timeZone: "",
        subjectsOfInterest: [],
        status: "Active",
        tutorIds: [],
        id: "",
        createdAt: "",
        userId: "",
      };
      try {
        tutors.push(migratedProfile);
      } catch (error) {
        errors.push(migratedProfile);
        console.error(`Error for row ${i}`);
      }
    }
    setTutors(tutors);
    setErroredTutorEntries(errors);
  };

  const handleMigrate = async () => {
    setUploading(true);
    setLoading(true);
    setIsOpen(true);
    try {
      if (file) {
        Papa.parse(file, {
          complete: async function (results) {
            // results.data is a 2x2 array

            const len: number = results.data.length;
            const headings = results.data.at(0);
            const data = results.data.slice(1, len);

            await handleMigrateStudents(len, data);
            await handleMigrateTutors(len, data);
          },
        });
        console.log("FILE UPLOADED");
      } else {
        throw new Error("No file selected");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const handleConfirmTutorMigration = async () => {
    setLoading(true);
    setError(null);
    setMigrationStatus("Migrating selected students...");

    const selectedTutorData = Array.from(selectedTutors).map(
      (index) => tutors[index]
    );

    const erroredEntries: Profile[] = [];

    selectedTutorData.forEach(async (entry) => {
      try {
        if ((await addTutor(entry)) === null) {
          throw new Error();
        }
      } catch (error) {
        erroredEntries.push(entry);
        console.log("Errored Entry");
      } finally {
        setErroredTutorEntries(erroredEntries);
      }
    });
    //     try {
    //       const selectedStudentData = Array.from(selectedStudents).map(index => students[index]);
    //       const response = await migrateSelectedStudents(selectedStudentData);

    //       if (response.success) {
    //         setMigrationStatus(`Successfully migrated ${response.migratedCount} students!`);
    //         setTimeout(() => {
    //           setIsOpen(false);
    //           setStudents([]);
    //           setSelectedStudents(new Set());
    //           setMigrationStatus('');
    //         }, 2000);
    //       } else {
    //         throw new Error(response.error);
    //       }
    //     } catch (error) {
    //       const errorMessage = error instanceof Error ? error.message : 'Migration failed';
    //       setError(errorMessage);
    //       setMigrationStatus('Migration failed. Please try again.');
    //       console.error('Migration failed:', error);
    //     } finally {
    //       setLoading(false);
    //     }
  };

  const handleConfirmStudentMigration = async () => {
    setLoading(true);
    setError(null);
    setMigrationStatus("Migrating selected students...");

    const selectedStudentData = Array.from(selectedStudents).map(
      (index) => students[index]
    );

    const erroredEntries: Profile[] = [];
    selectedStudentData.forEach(async (entry) => {
      try {
        if ((await addStudent(entry)) === null) {
          throw new Error();
        }
      } catch (error) {
        erroredEntries.push(entry);
        console.log("Errored Entry");
      } finally {
        setErroredStudentEntries(erroredEntries);
      }
    });
  };

  const handleUserSwitch = async () => {
    console.log("switched");
    setUserOption((prev) => !prev);
    if (showErrorEntries) {
      setShowErrorEntries(false);
    }
  };

  const handleShowErrorEntries = async () => {
    setShowErrorEntries(true);
  };

  return (
    // <div>
    //   <input type="file" onChange={handleFileChange} />
    //   <button onClick={handleUpload} disabled={uploading}>
    //     {uploading ? "Uploading..." : "Upload"}
    //   </button>
    // </div>

    <div className="container mx-auto p-8">
      <input type="file" onChange={handleFileChange} />
      <h1 className="text-3xl font-bold mb-8">Migrate Data</h1>

      <Button onClick={handleMigrate} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Migrate Users"
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-row gap-2">
              <DialogTitle
                onClick={handleUserSwitch}
                className={`${
                  showErrorEntries ? "" : userOption ? "" : "text-[#84ceeb]"
                } `}
              >
                Tutor Migration
              </DialogTitle>
              <DialogTitle> | </DialogTitle>
              <DialogTitle
                onClick={handleUserSwitch}
                className={`${
                  showErrorEntries ? "" : userOption ? "text-[#84ceeb]" : ""
                }`}
              >
                Student Migration
              </DialogTitle>
              <DialogTitle
                className={`${revealErrorEntries ? "" : "invisible"}`}
              >
                {" "}
                |{" "}
              </DialogTitle>
              <DialogTitle
                onClick={handleShowErrorEntries}
                className={`${
                  revealErrorEntries
                    ? showErrorEntries
                      ? "text-[#ff0000]"
                      : ""
                    : "invisible"
                }`}
              >
                Incomplete Migration
              </DialogTitle>
            </div>

            <DialogDescription>
              {userOption
                ? "Select the Students you want to migrate to the system."
                : "Select the Tutors you want to migrate to the system."}
            </DialogDescription>
          </DialogHeader>

          {userOption ? (
            students?.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        {/* <Checkbox
                            checked={selectedStudents.size === currentStudents.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all students"
                        /> */}
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Parent Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStudents.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(startIndex + index)}
                            onCheckedChange={() =>
                              toggleSelectStudent(startIndex + index)
                            }
                            aria-label={`Select ${student.firstName} ${student.lastName}`}
                          />
                        </TableCell>
                        <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          {student.subjectsOfInterest.join(", ")}
                        </TableCell>
                        <TableCell>
                          {formatAvailability(student.availability)}
                        </TableCell>
                        <TableCell>
                          {student.parentName && (
                            <div className="text-sm">
                              <div>{student.parentName}</div>
                              {student.parentEmail && (
                                <div>{student.parentEmail}</div>
                              )}
                              {student.parentPhone && (
                                <div>{student.parentPhone}</div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            ) : loading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <p className="text-center p-8">No students found</p>
            )
          ) : //-----Migrating Tutors-----
          tutors?.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      {/* <Checkbox
                            checked={selectedStudents.size === currentStudents.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all students"
                        /> */}
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Parent Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTutors.map((tutor, index) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTutors.has(startIndex + index)}
                          onCheckedChange={() =>
                            toggleSelectTutor(startIndex + index)
                          }
                          aria-label={`Select ${tutor.firstName} ${tutor.lastName}`}
                        />
                      </TableCell>
                      <TableCell>{`${tutor.firstName} ${tutor.lastName}`}</TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>
                        {tutor.subjectsOfInterest.join(", ")}
                      </TableCell>
                      <TableCell>
                        {formatAvailability(tutor.availability)}
                      </TableCell>
                      <TableCell>
                        {tutor.parentName && (
                          <div className="text-sm">
                            <div>{tutor.parentName}</div>
                            {tutor.parentEmail && (
                              <div>{tutor.parentEmail}</div>
                            )}
                            {tutor.parentPhone && (
                              <div>{tutor.parentPhone}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <p className="text-center p-8">No Tutors found</p>
          )}

          {migrationStatus && (
            <p className="text-center text-sm text-muted-foreground">
              {migrationStatus}
            </p>
          )}

          <DialogFooter>
            {userOption ? (
              <Button
                onClick={handleConfirmStudentMigration}
                disabled={loading || selectedStudents.size === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Migrate Selected (${selectedStudents.size})`
                )}
              </Button>
            ) : (
              <Button
                onClick={handleConfirmTutorMigration}
                disabled={loading || selectedTutors.size === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Migrate Selected (${selectedTutors.size})`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 'use client'
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from '@/components/ui/pagination';
// import { Loader2 } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { analyzeAndTransformStudents, migrateSelectedStudents,
//     type Profile  } from '@/lib/actions/migrate.actions';

// const ITEMS_PER_PAGE = 10;

// const formatAvailability = (availability: Profile['availability']): string => {
//     return availability
//       .map(slot => `${slot.day} ${slot.startTime}-${slot.endTime}`)
//       .join(', ');
// };

// const MigrateDataPage: React.FC = () => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [students, setStudents] = useState<Profile[]>([]);
//     const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
//     const [currentPage, setCurrentPage] = useState(1);
//     const [migrationStatus, setMigrationStatus] = useState('');

//   const totalPages = Math.ceil(students?.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const currentStudents = students?.slice(startIndex, endIndex);

//   const handleMigrateClick = async () => {
//     setLoading(true);
//     setIsOpen(true);
//     try {
//       const fetchedStudents = await analyzeAndTransformStudents();
//       if (fetchedStudents) {
//         setStudents(fetchedStudents.data as Profile[]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch students:', error);
//       setMigrationStatus('Failed to fetch students. Please try again.');
//     }
//     setLoading(false);
//   };

//   const toggleSelectAll = () => {
//     if (selectedStudents.size === currentStudents.length) {
//       setSelectedStudents(new Set());
//     } else {
//       setSelectedStudents(new Set(currentStudents.map((_, index) => startIndex + index)));
//     }
//   };

//   const toggleSelectStudent = (index: number) => {
//     const newSelected = new Set(selectedStudents);
//     if (newSelected.has(index)) {
//       newSelected.delete(index);
//     } else {
//       newSelected.add(index);
//     }
//     setSelectedStudents(newSelected);
//   };

//   const handleConfirmMigration = async () => {
//     setLoading(true);
//     setError(null);
//     setMigrationStatus('Migrating selected students...');

//     try {
//       const selectedStudentData = Array.from(selectedStudents).map(index => students[index]);
//       const response = await migrateSelectedStudents(selectedStudentData);

//       if (response.success) {
//         setMigrationStatus(`Successfully migrated ${response.migratedCount} students!`);
//         setTimeout(() => {
//           setIsOpen(false);
//           setStudents([]);
//           setSelectedStudents(new Set());
//           setMigrationStatus('');
//         }, 2000);
//       } else {
//         throw new Error(response.error);
//       }
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Migration failed';
//       setError(errorMessage);
//       setMigrationStatus('Migration failed. Please try again.');
//       console.error('Migration failed:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-8">
//       <h1 className="text-3xl font-bold mb-8">Migrate Data</h1>

//       <Button
//         onClick={handleMigrateClick}
//         disabled={loading}
//       >
//         {loading ? (
//           <>
//             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             Processing...
//           </>
//         ) : (
//           'Migrate Students'
//         )}
//       </Button>

//       <Dialog open={isOpen} onOpenChange={setIsOpen}>
//         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Student Migration</DialogTitle>
//             <DialogDescription>
//               Select the students you want to migrate to the system.
//             </DialogDescription>
//           </DialogHeader>

//           {students?.length > 0 ? (
//             <>
//                 <Table>
//                     <TableHeader>
//                     <TableRow>
//                         <TableHead className="w-12">
//                         <Checkbox
//                             checked={selectedStudents.size === currentStudents.length}
//                             onCheckedChange={toggleSelectAll}
//                             aria-label="Select all students"
//                         />
//                         </TableHead>
//                         <TableHead>Name</TableHead>
//                         <TableHead>Email</TableHead>
//                         <TableHead>Subjects</TableHead>
//                         <TableHead>Availability</TableHead>
//                         <TableHead>Parent Info</TableHead>
//                     </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                     {currentStudents.map((student, index) => (
//                         <TableRow key={student.id}>
//                         <TableCell>
//                             <Checkbox
//                             checked={selectedStudents.has(startIndex + index)}
//                             onCheckedChange={() => toggleSelectStudent(startIndex + index)}
//                             aria-label={`Select ${student.firstName} ${student.lastName}`}
//                             />
//                         </TableCell>
//                         <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
//                         <TableCell>{student.email}</TableCell>
//                         <TableCell>{student.subjectsOfInterest.join(', ')}</TableCell>
//                         <TableCell>{formatAvailability(student.availability)}</TableCell>
//                         <TableCell>
//                             {student.parentName && (
//                             <div className="text-sm">
//                                 <div>{student.parentName}</div>
//                                 {student.parentEmail && <div>{student.parentEmail}</div>}
//                                 {student.parentPhone && <div>{student.parentPhone}</div>}
//                             </div>
//                             )}
//                         </TableCell>
//                         </TableRow>
//                     ))}
//                     </TableBody>
//                 </Table>

//               <Pagination>
//                 <PaginationContent>
//                   <PaginationItem>
//                     <PaginationPrevious
//                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//                       aria-disabled={currentPage === 1}
//                     />
//                   </PaginationItem>

//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
//                     <PaginationItem key={page}>
//                       <PaginationLink
//                         onClick={() => setCurrentPage(page)}
//                         isActive={currentPage === page}
//                       >
//                         {page}
//                       </PaginationLink>
//                     </PaginationItem>
//                   ))}

//                   <PaginationItem>
//                     <PaginationNext
//                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//                       aria-disabled={currentPage === totalPages}
//                     />
//                   </PaginationItem>
//                 </PaginationContent>
//               </Pagination>
//             </>
//           ) : loading ? (
//             <div className="flex justify-center items-center p-8">
//               <Loader2 className="h-8 w-8 animate-spin" />
//             </div>
//           ) : (
//             <p className="text-center p-8">No students found</p>
//           )}

//           {migrationStatus && (
//             <p className="text-center text-sm text-muted-foreground">
//               {migrationStatus}
//             </p>
//           )}

//           <DialogFooter>
//             <Button
//               onClick={handleConfirmMigration}
//               disabled={loading || selectedStudents.size === 0}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 `Migrate Selected (${selectedStudents.size})`
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default MigrateDataPage;
