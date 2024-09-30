'use client'
import React from 'react';
import Link from 'next/link';
import { Search, Link as LinkIcon, LogOut, ChevronLeft,Calendar, Bell, Home, HelpCircle, Settings, Compass } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from '@/components/ui/logo';
import { useRouter } from 'next/navigation';  // Import useRouter

import { logoutUser } from '@/lib/actions/user.actions';

interface SidebarProps {
  role: string;
}


export function SettingsSidebar() {

  const router = useRouter();  // Initialize useRouter

  const handleLogout = async () => {
    await logoutUser();  // Ensure logout action completes
    router.push('/login');  // Redirect to login after logout
  };

  return (
    <nav className="w-56 bg-white border-r h-screen flex flex-col">
      <Logo />
      <Link href='/dashboard/'>
          <Button variant="ghost" className="w-full justify-start">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      <div className="p-4">
        <div className="relative">
          <h2 className="text-xl font-bold mb-2">Settings</h2>
          <p className='text-sm text-gray-500'>
            Manage your account settings and profile preferences
          </p>
        </div>
      </div>
      <ul className="mt-0 flex-grow space-y-1 p-2">
        <Link href='/dashboard/settings'>
          <Button variant="ghost" className="w-full justify-start">
            <HelpCircle className="mr-2 h-4 w-4" />
            Account
          </Button>
        </Link>
        <Link href='/dashboard/settings/profile'>
          <Button variant="ghost" className="w-full justify-start">
            <HelpCircle className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </Link>
      </ul>
      <div className="p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}