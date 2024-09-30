import React from 'react';
import { Search, Link as LinkIcon, Home, HelpCircle, Settings, Compass, Globe } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Logo() {

    return (
    <div className="p-4 flex items-center space-x-2">
        <div className="bg-blue-500 text-white p-1 rounded">
          <Globe size={24} />
        </div>
        <span className="text-xl font-semibold">Connect Me</span>
    </div>
    )
}