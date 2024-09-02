"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/user.actions";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "shadcn",
    email: "",
    bio: "I own a computer.",
    urls: ["https://shadcn.com", "http://twitter.com/shadcn"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile("user_id", profile);
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="text-gray-600 mb-6">This is how others will see you on the site.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Username</label>
          <Input
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
          <p className="text-sm text-gray-600 mt-1">
            This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days.
          </p>
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Select a verified email to display"
          />
          <p className="text-sm text-gray-600 mt-1">
            You can manage verified email addresses in your email settings.
          </p>
        </div>

        <div>
          <label className="block mb-1">Bio</label>
          <Textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <p className="text-sm text-gray-600 mt-1">
            You can @mention other users and organizations to link to them.
          </p>
        </div>

        <div>
          <label className="block mb-1">URLs</label>
          {profile.urls.map((url, index) => (
            <Input
              key={index}
              value={url}
              onChange={(e) => {
                const newUrls = [...profile.urls];
                newUrls[index] = e.target.value;
                setProfile({ ...profile, urls: newUrls });
              }}
              className="mb-2"
            />
          ))}
          <Button
            type="button"
            onClick={() => setProfile({ ...profile, urls: [...profile.urls, ""] })}
            variant="outline"
          >
            Add URL
          </Button>
        </div>

        <Button type="submit">Update profile</Button>
      </form>
    </div>
  );
}