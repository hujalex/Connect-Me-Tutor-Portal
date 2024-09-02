"use client";

import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/user.actions";

export default function AccountPage() {
  const handleLogout = async () => {
    await logoutUser();
    // Redirect to login page or home page after logout
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <p className="text-gray-600 mb-6">Manage your account settings and preferences.</p>
      
      {/* Add more account-related settings here */}
      
      <Button onClick={handleLogout} variant="destructive">
        Log out
      </Button>
    </div>
  );
}