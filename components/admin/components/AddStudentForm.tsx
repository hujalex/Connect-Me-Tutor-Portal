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

interface AddStudentFormProps {
  newStudent: Partial<Profile>;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleGradeChange: (value: string) => void;
  handleTimeZone: (value: string) => void;
  handleGender: (value: string) => void;
  handleSubjectsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddStudent: () => void;
  addingStudent: boolean;
}

const AddStudentForm = ({
  newStudent,
  handleInputChange,
  handleGradeChange,
  handleTimeZone,
  handleGender,
  handleSubjectsChange,
  handleAddStudent,
  addingStudent,
}: AddStudentFormProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getOrdinalSuffix = (num: number): string => {
    if (num === 1) return "st";
    if (num === 2) return "nd";
    if (num === 3) return "rd";
    return "th";
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button>Add Student</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
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
                value={newStudent.studentNumber ?? ""}
                onChange={handleInputChange}
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
                    <SelectItem value="Kindergarten">Kindergarten</SelectItem>
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
                  value={newStudent.gender}
                  onValueChange={handleGender}
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
                value={newStudent.email}
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
              <Label htmlFor="subjectsOfInterest" className="text-right">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentForm;
