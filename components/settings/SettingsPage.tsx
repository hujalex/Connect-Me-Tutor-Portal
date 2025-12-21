"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile } from "@/lib/actions/user.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { datacatalog } from "googleapis/build/src/apis/datacatalog";

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile | null>(null);
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

  useEffect(() => {
    fetchUser();
  }, []);

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
    } catch (error) {
      console.error("Error fetching user:", error);
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

  return (
    <>
      <Toaster />{" "}
      <main className="p-8 max-w-4xl mx-auto">
        <div className="space-y-12">
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
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                          Beginning June 29th
                        </span>
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
              <h2 className="text-2xl font-bold">Profile Settings</h2>
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                In Development
              </span>
            </div>

            <p className="text-gray-600 mb-6">
              Manage your profile information and account preferences.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    placeholder="Enter your first name (e.g John)"
                    className="mt-1 placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="last-name" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    placeholder="Enter your last name (e.g Smith)"
                    className="mt-1 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone-number" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Enter your phone number (e.g (555) 123-4567)"
                    className="mt-1 placeholder:text-gray-300"
                  />
                </div>

                <div>
                  {/* hi */}
                  <Label htmlFor="age" className="text-sm font-medium">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age (e.g 25)"
                    className="mt-1 placeholder:text-gray-300"
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
                  placeholder="Enter your email (e.g john@example.com)"
                  className="mt-1 placeholder:text-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself (e.g What hobbies do you enjoy?)"
                  className="mt-1 placeholder:text-gray-300"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="subjects" className="text-sm font-medium">
                  Subjects of Interest
                </Label>
                <Textarea
                  id="subjects"
                  placeholder="Enter your subjects of interest (e.g Mathematics, Physics, Chemistry)"
                  className="mt-1 placeholder:text-gray-300"
                  rows={4}
                />
              </div>

              <div>
                {/* hi */}
                <Label htmlFor="languages" className="text-sm font-medium">
                  Languages Spoken
                </Label>
                <Textarea
                  id="languages"
                  placeholder="Enter languages you speak (e.g English, Spanish, French)"
                  className="mt-1 placeholder:text-gray-300"
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
