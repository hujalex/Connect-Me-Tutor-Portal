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

interface EditTutorFormProps {
  isReactivateModalOpen: boolean;
  setIsReactivateModalOpen: (value: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (value: boolean) => void;
  tutors: Profile[];
  selectedTutor: Profile | null;
  selectedTutorId: string | null;
  setSelectedTutorId: (value: string) => void;
  handleEditTutor: () => void;
  handleGetSelectedTutor: (value: string | null) => void;
  handleInputChangeForEdit: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleTimeZoneForEdit: (value: string) => void;
}

const EditTutorForm = ({
  isReactivateModalOpen,
  setIsReactivateModalOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  tutors,
  selectedTutor,
  selectedTutorId,
  setSelectedTutorId,
  handleEditTutor,
  handleGetSelectedTutor,
  handleInputChangeForEdit,
  handleTimeZoneForEdit,
}: EditTutorFormProps) => {
  return (
    <Dialog
      open={isReactivateModalOpen}
      onOpenChange={setIsReactivateModalOpen}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-500">Edit Tutor</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Tutor to Edit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="tutorSelect" className="text-right">
            Tutor
          </Label>
          <div className="relative">
            <Combobox
              list={tutors.map((tutor) => ({
                value: tutor.id,
                label: `${tutor.firstName} ${tutor.lastName} - ${tutor.email}`,
              }))}
              category="tutor"
              onValueChange={setSelectedTutorId}
            />
          </div>
        </div>
        {/*Edit Page*/}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!selectedTutorId}
              onClick={() => handleGetSelectedTutor(selectedTutorId)}
            >
              Select Tutor to edit
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tutor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={selectedTutor?.firstName}
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
                  value={selectedTutor?.lastName}
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
                  disabled={true}
                  value={selectedTutor?.email}
                  onChange={handleInputChangeForEdit}
                  className="col-span-3"
                />
              </div>
              {/* <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="dateOfBirth" className="text-right">
                                Date of Birth
                              </Label>
                              <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={selectedTutor?.dateOfBirth}
                                onChange={handleInputChangeForEdit}
                                className="col-span-3"
                              />
                            </div> */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={selectedTutor?.startDate}
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
                    value={selectedTutor?.timeZone}
                    onValueChange={handleTimeZoneForEdit}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="CST">CST</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Add more fields for availability if needed */}
              </div>
            </div>
            <Button onClick={handleEditTutor}>Finish editing tutor</Button>
          </DialogContent>
        </Dialog>

        {/* <Button
                        onClick={handleReactivateTutor}
                        disabled={!selectedTutorId}
                      >
                        Confirm Reactivation
                      </Button> */}
      </DialogContent>
    </Dialog>
  );
};

export default EditTutorForm;
