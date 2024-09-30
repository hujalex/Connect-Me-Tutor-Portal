'use client'; // Ensure this is at the top for Next.js

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Link as LinkIcon, 
  LogOut, 
  Calendar, 
  Bell, 
  Home, 
  HelpCircle, 
  Settings, 
  Compass, 
  HelpCircleIcon, 
  PanelLeftCloseIcon, 
  PanelLeftOpenIcon // Added this icon for reopening sidebar
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from '@/components/ui/logo';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { logoutUser } from '@/lib/actions/user.actions';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider, // Import TooltipProvider
} from "@/components/ui/tooltip";

interface SidebarProps {
  role: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
<section>


    <header>

    </header>
</section>
  );
};

export default Sidebar;
