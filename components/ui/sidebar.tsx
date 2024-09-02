import React from 'react';
import { Search, Link as LinkIcon, Home, HelpCircle, Settings } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-4 flex items-center space-x-2">
        <div className="bg-blue-500 text-white p-2 rounded">
          <LinkIcon size={24} />
        </div>
        <span className="text-xl font-semibold">Connect Me</span>
      </div>
      <div className="p-4">
        <div className="relative">
          <Input type="text" placeholder="Search" className="pl-8" />
          <Search className="absolute left-2 top-2.5 text-gray-400" size={20} />
        </div>
      </div>
      <nav className="mt-4 flex-grow space-y-1 p-2">
        <Button variant="ghost" className="w-full justify-start">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help Desk
        </Button>
      </nav>
      <div className="p-4">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;