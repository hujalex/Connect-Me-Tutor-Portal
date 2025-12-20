"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfile, getUserInfo, updateProfile } from "@/lib/actions/user.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { datacatalog } from "googleapis/build/src/apis/datacatalog";
import { switchProfile } from "@/lib/actions/profile.server.actions";

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [userProfiles, setUserProfiles] = useState<Partial<Profile>[]>([]);
  const [sessionReminders, setSessionReminders] = useState(false);
  const [sessionEmailNotifications, setSessionEmailNotifications] =
    useState(false);
  const [sessionTextNotifications, setSessionTextNotifications] =
    useState(false);
  const [webinarReminders, setWebinarReminders] = useState(false);
  const [webinarEmailNotifications, setWebinarEmailNotifications] =
    useState(false);
  const [webinarTextNotifications, setWebinarTextNotifications] =
    useState(false);
  const [settingsId, setSettingsId] = useState("");


  const fetchUserInfo = async () => {
      const userId = await fetchUser();
      if (userId) await fetchUserProfiles(userId);
    };


  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {});

  useEffect(() => {
    fetchNotificationSettings();
  }, [profile]);

  const fetchUser = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) throw new Error("No user found");

      const profileData = await getProfile(user.id);
      if (!profileData) throw new Error("No profile found");

      setProfile(profileData);
      setProfileId(profileData.id)
      return user.id;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchUserProfiles = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("Profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          email
          `
        )
        .eq("user_id", userId)
        .throwOnError();

      const profiles: Partial<Profile>[] = data.map((profile) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
      }));

      setUserProfiles(profiles);
    } catch (error) {
      toast.error("Error fetching profiles");
      console.error("Error fetching other profiles", error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      if (profile) {
        const { data, error } = await supabase
          .from("user_notification_settings")
          .select("*")
          .eq("id", profile.settingsId)
          .single();
        if (error) throw error;

        setSessionEmailNotifications(
          data.email_tutoring_session_notifications_enabled
        );
        setSessionTextNotifications(false);
        setWebinarEmailNotifications(data.email_webinar_notifications_enabled);
        setWebinarTextNotifications(data.text_webinar_notifications_enabled);

        setSessionReminders(
          data.email_tutoring_session_notifications_enabled ||
            data.text_tutoring_session_notifications_enabled
        );

        setWebinarReminders(false);

        setSettingsId(profile.settingsId);
      }
    } catch (error) {
      console.error("Unable to fetch notification settings", error);
      throw error;
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Handle profile update logic here
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      // Handle notification settings save logic here
      // You could show a success toast here

      const { data, error } = await supabase
        .from("user_notification_settings")
        .update({
          email_tutoring_session_notifications_enabled:
            sessionEmailNotifications,
          text_tutoring_session_notifications_enabled: sessionTextNotifications,
          email_webinar_notifications_enabled: webinarEmailNotifications,
          text_webinar_notifications_enabled: webinarTextNotifications,
        })
        .eq("id", settingsId);

      if (error) throw error;

      await fetchNotificationSettings();
      toast.success("Saved Notification Settings");
      
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Unable to save notification settings");
    }
  };

  const handleSwitchProfile = async () => {
    try {
      if (profile) await switchProfile(profile?.userId, profileId);
      toast.success("Switched Account")
    } catch (error) {
      console.error("Unable to switch account", error);
      toast.error("Unable to switch account");
    }
  };

  return (
    <>
      <Toaster />{" "}
      <main className="p-8 max-w-4xl mx-auto">
        <div className="space-y-12">
          {/* Switch Profiles Section */}
          <section className="bg-white rounded-lg border p-6">
            <h1 className="text-2xl font-bold mb-6">Profiles</h1>
            <div className="space-y-8">
              {/* Profiles */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="text-lg font-semibold">Your Profiles</h3>
                </div>
                <Select onValueChange={setProfileId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder = {profile ? `${profile?.firstName} ${profile?.lastName}` : ""}/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Profiles</SelectLabel>
                      {userProfiles.map((profile) => (
                        <SelectItem value={profile.id || ""}>
                          {profile.firstName} {profile.lastName}
                        </SelectItem>
                      ))}
                      {/* <SelectItem value="all">All</SelectItem> */}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button
              onClick={handleSwitchProfile}
              className="mt-6 w-full sm:w-auto"
            >
              Switch Profile
            </Button>
          </section>
          {/* Notifications Section */}
          <section className="bg-white rounded-lg border p-6">
            <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

            <div className="space-y-8">
              {/* Session Reminders */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Session Reminders</h3>
                    <p className="text-sm text-gray-600">
                      Get notified about upcoming tutoring sessions
                    </p>
                  </div>
                  <Switch
                    id="session-reminders"
                    checked={sessionReminders}
                    onCheckedChange={setSessionReminders}
                  />
                </div>

                {sessionReminders && (
                  <div className="mt-4 ml-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="session-email" className="text-base">
                          Email notifications
                        </Label>
                      </div>

                      <Switch
                        id="session-email"
                        checked={sessionEmailNotifications}
                        onCheckedChange={setSessionEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="session-text" className="text-base">
                          Text notifications
                        </Label>
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          In Development
                        </span>
                      </div>
                      <Switch
                        id="session-text"
                        checked={sessionTextNotifications}
                        onCheckedChange={setSessionTextNotifications}
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Webinar Reminders */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Webinar Reminders</h3>
                    <p className="text-sm text-gray-600">
                      Get notified about upcoming webinars and events
                    </p>
                  </div>
                  <Switch
                    id="webinar-reminders"
                    checked={webinarReminders}
                    onCheckedChange={setWebinarReminders}
                  />
                </div>

                {webinarReminders && (
                  <div className="mt-4 ml-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="webinar-email" className="text-base">
                        Email notifications
                      </Label>
                      <Switch
                        id="webinar-email"
                        checked={webinarEmailNotifications}
                        onCheckedChange={setWebinarEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="webinar-text" className="text-base">
                          Text notifications
                        </Label>
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          In Development
                        </span>
                      </div>
                      <Switch
                        id="webinar-text"
                        checked={webinarTextNotifications}
                        onCheckedChange={setWebinarTextNotifications}
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveNotifications}
              className="mt-6 w-full sm:w-auto"
            >
              Save Notification Settings
            </Button>
          </section>

          {/* Profile Section */}
          <section className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                In Development
              </span>
            </div>

            <p className="text-gray-600 mb-6">
              Manage your information and account preferences.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    placeholder="Enter your first name"
                    disabled
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="last-name" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    placeholder="Enter your last name"
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  disabled
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  disabled
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button type="submit" disabled className="w-full sm:w-auto">
                Update Profile
              </Button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
