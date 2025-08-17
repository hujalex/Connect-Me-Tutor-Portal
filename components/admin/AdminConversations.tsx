"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllProfiles } from "@/lib/actions/admin.actions";
import { Profile } from "@/types";

// Sample profiles data - replace with your actual data source
// const profiles = [
//   { id: "1", name: "Sarah Johnson", role: "Marketing Manager", avatar: "SJ" },
//   { id: "2", name: "Mike Chen", role: "Software Engineer", avatar: "MC" },
//   { id: "3", name: "Emily Rodriguez", role: "Product Designer", avatar: "ER" },
//   { id: "4", name: "David Kim", role: "Data Analyst", avatar: "DK" },
//   { id: "5", name: "Lisa Thompson", role: "Customer Success", avatar: "LT" },
//   { id: "6", name: "Alex Morgan", role: "Sales Director", avatar: "AM" },
// ];

const existingConversations = [
  {
    id: "1",
    personName: "Sarah Johnson",
    title: "Q4 Marketing Strategy",
    lastMessage: "2 hours ago",
  },
  {
    id: "2",
    personName: "Mike Chen",
    title: "API Integration Discussion",
    lastMessage: "1 day ago",
  },
  {
    id: "3",
    personName: "Emily Rodriguez",
    title: "Design System Updates",
    lastMessage: "3 days ago",
  },
  {
    id: "4",
    personName: "David Kim",
    title: "Analytics Review",
    lastMessage: "1 week ago",
  },
  {
    id: "5",
    personName: "Lisa Thompson",
    title: "Customer Feedback",
    lastMessage: "2 weeks ago",
  },
];

export function AdminConversationManager() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [openProfileOptions, setOpenProfileOptions] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationDescription, setConversationDescription] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const selectedProfile = profiles.find(
    (profile) => profile.id === selectedProfileId
  );

  useEffect(() => {
    (async () => {
      const [tutors, students] = await Promise.all([
        getAllProfiles("Tutor"),
        getAllProfiles("Student"),
      ]);
      if (!tutors || !students) {
        return console.error("failed to load profiles");
      }
      setProfiles([...tutors, ...students]);
    })();
  }, []);

  const handleCreateConversation = () => {
    if (!selectedProfileId) {
      return;
    }

    // Handle conversation creation logic here
    console.log("Creating conversation:", {
      profileId: selectedProfileId,
      title: conversationTitle,
      description: conversationDescription,
    });

    // Reset form
    setSelectedProfileId("");
    setConversationTitle("");
    setConversationDescription("");
    setProfileSearch("");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create New Conversation
          </h1>
          <p className="text-muted-foreground">
            Start a conversation with a team member
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Conversation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation Details
                </CardTitle>
                <CardDescription>
                  Fill in the details below to create a new conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Selection */}
                <div className="space-y-2">
                  <Label htmlFor="profile">Select Profile</Label>
                  <Popover
                    open={openProfileOptions}
                    onOpenChange={setOpenProfileOptions}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openProfileOptions}
                        className="w-full justify-between bg-transparent"
                      >
                        {selectedProfile ? (
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {selectedProfile.firstName
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-medium">
                                {`${selectedProfile.firstName} ${selectedProfile.lastName}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {selectedProfile.role}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Select a profile...
                          </span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search profiles..."
                          value={profileSearch}
                          onValueChange={setProfileSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No profile found.</CommandEmpty>
                          <CommandGroup>
                            {profiles.map((profile) => (
                              <CommandItem
                                key={profile.id}
                                value={profile.id}
                                className="text-black"
                                keywords={[
                                  profile.firstName,
                                  profile.lastName,
                                  profile.role,
                                ]}
                                onSelect={() => {
                                  setSelectedProfileId(profile.id);
                                  setOpenProfileOptions(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProfileId === profile.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {/* <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                    {profile.avatar}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {profile.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {profile.role}
                                    </div>
                                  </div>
                                </div> */}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Conversation Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Conversation Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter conversation title..."
                    value={conversationTitle}
                    onChange={(e) => setConversationTitle(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCreateConversation}
                    disabled={!selectedProfileId || ""}
                    className="flex-1"
                  >
                    Create Conversation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProfileId("");
                      setConversationTitle("");
                      setConversationDescription("");
                      setProfileSearch("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {selectedProfile && conversationTitle && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                      {selectedProfile.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {selectedProfile.name}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedProfile.role}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {conversationTitle}
                      </h3>
                      {conversationDescription && (
                        <p className="text-sm text-muted-foreground">
                          {conversationDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Conversations</CardTitle>
                <CardDescription>Your ongoing conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conversation.personName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                ))}
                {existingConversations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
