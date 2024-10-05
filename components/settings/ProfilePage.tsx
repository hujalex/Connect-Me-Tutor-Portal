"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/user.actions";

export default function ProfilePage() {

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="text-gray-600 mb-6">Change your profile information and preferences.</p>
        <form>

        <Button type="submit">Update profile</Button>
      </form>
    </div>
  );
}