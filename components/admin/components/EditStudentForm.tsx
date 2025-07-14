import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile } from "@/types";
import { Combobox } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scrollarea";

interface EditStudentFormProps {
  students: Profile[];
  selectedStudentId: string | null;
  setSelectedStudentId: (value: string) => void;
  handleGetSelectedStudent: (value: string | null) => void;
  selectedStudent: Profile | null;
  handleInputChangeForEdit: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleGradeChangeForEdit: (value: string) => void;
  handleGenderForEdit: (value: string) => void;
  handleTimeZoneForEdit: (value: string) => void;
  handleSubjectsChangeForEdit: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getOrdinalSuffix: (value: number) => void;
  handleEditStudent: () => void;
}

const EditStudentForm = ({
  students,
  selectedStudentId,
  setSelectedStudentId,
  handleGetSelectedStudent,
  selectedStudent,
  handleInputChangeForEdit,
  handleGradeChangeForEdit,
  handleGenderForEdit,
  handleTimeZoneForEdit,
  handleSubjectsChangeForEdit,
  getOrdinalSuffix,
  handleEditStudent,
}: EditStudentFormProps) => {
  const [isReactivateModalOpen, setIsReactivateModalOpen] =
    useState<boolean>(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  return (
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
                  label: `${student.firstName} ${student.lastName} - ${student.email}`,
                }))}
              category="student"
              onValueChange={setSelectedStudentId}
            />
          </div>
        </div>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!selectedStudentId}
              onClick={() => handleGetSelectedStudent(selectedStudentId)}
            >
              Select Student to edit
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[calc(80vh-120px)] pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="studentNumber" className="text-right">
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
                <div className="grid grid-cols-8 items-center gap-4">
                  <Label htmlFor="age" className="text-right col-span-2">
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
                        <SelectItem value="Kindergarten">K</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={`${i + 1}${getOrdinalSuffix(i + 1)}-grade`}
                          >
                            {`${i + 1}${getOrdinalSuffix(i + 1)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right">
                    Gender
                  </Label>
                  <div className="col-span-3">
                    {" "}
                    <Select
                      name="gender"
                      value={selectedStudent?.gender}
                      onValueChange={handleGenderForEdit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Label htmlFor="subjectsOfInterest" className="text-right">
                    Subjects of Interest
                  </Label>
                  <Input
                    id="subjectsOfInterest"
                    name="subjectsOfInterest"
                    value={selectedStudent?.subjectsOfInterest?.join(", ")}
                    onChange={handleSubjectsChangeForEdit}
                    className="col-span-3"
                  />
                </div>
                {/* Add more fields for availability if needed */}
              </div>

              <Button onClick={handleEditStudent}>
                Finish editing student
              </Button>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentForm;
