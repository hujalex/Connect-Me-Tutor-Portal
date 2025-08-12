"use client"; // This needs to be at the top to declare a client component

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  getProfileRole,
  getSessionUserProfile,
  logoutUser,
} from "@/lib/actions/user.actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Link as LinkIcon,
  LogOut,
  Calendar,
  Bell,
  Home,
  CirclePlus,
  Settings,
  Compass,
  HelpCircleIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon, // Added this icon for reopening sidebar,
  Users,
  TrendingUp,
  Bookmark,
  LayoutDashboardIcon,
  Layers,
  User,
  Clock,
  ChevronLeft,
  UserIcon,
  BookOpenText,
  CircleUserRound,
  Mail,
  MessageCircleIcon,
  ListOrdered,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider, // Import TooltipProvider
} from "@/components/ui/tooltip";
import { toast, Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null); // For displaying profile data
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsPage = pathname === "/dashboard/settings";

  const settingsSidebarItems = [
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: <CircleUserRound className="h-5 w-5" />,
    },
  ];

  const studentSidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    {
      title: "Chats",
      href: "/dashboard/chats",
      icon: <MessageCircleIcon className="h-5 w-5" />,
    },
    {
      title: "Pairings",
      href: "/dashboard/pairings",
      icon: <LinkIcon className="h-5 w-5" />,
    },
  ];

  const tutorSidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },
    {
      title: "My Students",
      href: "/dashboard/my-students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Chats",
      href: "/dashboard/chats",
      icon: <MessageCircleIcon className="h-5 w-5" />,
    },
    {
      title: "My Hours",
      href: "/dashboard/my-stats",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Resources",
      href: "/dashboard/resources",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Pairings",
      href: "/dashboard/pairings",
      icon: <LinkIcon className="h-5 w-5" />,
    },
  ];

  const adminSidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
    },

    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: "Schedule",
      href: "/dashboard/schedule",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Enrollments",
      href: "/dashboard/enrollments",
      icon: <BookOpenText className="h-5 w-5" />,
    },
    {
      title: "Hours Manager",
      href: "/dashboard/hours-manager",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "All Tutors",
      href: "/dashboard/all-tutors",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "All Students",
      href: "/dashboard/all-students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Email Manager",
      href: "/dashboard/email-manager",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "Pairing Que",
      href: "/dashboard/pairing-que",
      icon: <ListOrdered className="h-5 w-5" />,
    },
    // {
    //   title: "Migrate Profiles",
    //   href: "/dashboard/migrate",
    //   icon: <CirclePlus className="h-5 w-5" />,
    // },
  ];

  useEffect(() => {
    const getUserProfileRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await getSessionUserProfile();
          const profileRole = await getProfileRole(user.id);
          if (profileRole) {
            setRole(profileRole);
          }
          // Simulating getting profile information from somewhere
          setProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfileRole();
  }, [supabase.auth]);

  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    toast.success("Successfully logging out");
    await logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <section className="grid grid-cols-[1fr_4fr] gap-10 m-10">
        <Skeleton className="h-[800px] w-full rounded-lg" />
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </section>
    );
  }

  if (!role) {
    router.push("/");
    return null;
  }

  // Layout with Sidebar and Navbar
  return (
    <div className="flex h-screen ">
      <TooltipProvider>
        {" "}
        {/* Wrap with TooltipProvider */}
        {/* Sidebar container */}
        <aside
          className={cn(
            "hidden sm:flex flex-col h-full bg-card z-30 transition-all duration-300 ease-in-out",
            isOpen ? "w-56" : "w-16"
          )}
        >
          <div className="flex flex-col h-full relative">
            {/* Logo */}
            <div className="h-16 p-4 flex items-center">
              <Link
                href="/"
                className="flex items-center px-1 text-sm font-medium rounded-md transition-colors"
              >
                <div className="text-white p-1 rounded">
                  {/* <Compass size={18} /> */}
                  <Image alt="logo" height="30" width="30" src="/logo.png" />
                </div>
                {isOpen && (
                  <span className="font-bold text-lg ml-2">Connect Me</span>
                )}
              </Link>
            </div>

            {/* Close button (shown when sidebar is open) */}
            {isOpen && (
              <Button
                onClick={toggleSidebar}
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
              >
                <PanelLeftCloseIcon className="h-4 w-4" />
              </Button>
            )}

            {/* Navigation */}
            {isSettingsPage && (
              <>
                {isOpen && (
                  <div className="px-4 py-2">
                    <div className="relative">
                      <p className="text-sm text-gray-500">
                        Manage your account settings and preferences.
                      </p>
                    </div>
                  </div>
                )}

                {isOpen ? (
                  <Breadcrumb className="p-4">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">
                          Dashboard
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Settings</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                ) : (
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          asChild
                          variant="ghost"
                          className={cn(
                            "w-full justify-start",
                            !isOpen && "justify-center px-2"
                          )}
                        >
                          <Link href="/dashboard/">
                            <LayoutDashboardIcon className="h-5 w-5" />
                            {isOpen && <span className="ml-3">Dashboard</span>}
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      {!isOpen && (
                        <TooltipContent side="right">
                          <p>Dashboard</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                )}

                <nav className="flex-grow space-y-1 ">
                  <>
                    {settingsSidebarItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "w-full justify-start",
                              pathname === item.href
                                ? "bg-blue-400/10 text-blue-500"
                                : "text-primary-dark hover:bg-muted hover:text-foreground",
                              !isOpen && "justify-center px-2"
                            )}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              {isOpen && (
                                <span className="ml-3">{item.title}</span>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </>
                </nav>
              </>
            )}

            {/* Navigation */}
            {!isSettingsPage && (
              <nav className="flex-grow space-y-1 px-3">
                {role === "Student" && (
                  <>
                    {studentSidebarItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "w-full justify-start",
                              pathname === item.href
                                ? "bg-blue-400/10 text-blue-500"
                                : "text-primary-dark hover:bg-muted hover:text-foreground",
                              !isOpen && "justify-center px-2"
                            )}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              {isOpen && (
                                <span className="ml-3">{item.title}</span>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </>
                )}

                {/* Tutor Role Navigation */}
                {role === "Tutor" && (
                  <>
                    {tutorSidebarItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "w-full justify-start",
                              pathname === item.href
                                ? "bg-blue-400/10 text-blue-500"
                                : "text-primary-dark hover:bg-muted hover:text-foreground",
                              !isOpen && "justify-center px-2"
                            )}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              {isOpen && (
                                <span className="ml-3">{item.title}</span>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </>
                )}

                {/* Admin Role Navigation */}
                {role === "Admin" && (
                  <>
                    {adminSidebarItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "w-full justify-start",
                              pathname === item.href
                                ? "bg-blue-400/10 text-blue-500"
                                : "text-primary-dark hover:bg-muted hover:text-foreground",
                              !isOpen && "justify-center px-2"
                            )}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              {isOpen && (
                                <span className="ml-3">{item.title}</span>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </>
                )}
              </nav>
            )}

            {/* Settings and Logout */}
            <div className="px-3 space-y-2 mb-2">
              {!isSettingsPage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        !isOpen && "justify-center px-2"
                      )}
                    >
                      <Link href="/dashboard/settings">
                        <Settings className="h-5 w-5" />
                        {isOpen && <span className="ml-3">Settings</span>}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {!isOpen && (
                    <TooltipContent side="right">
                      <p>Settings</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      !isOpen && "justify-center px-2"
                    )}
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isOpen && <span className="ml-2">Logout</span>}
                  </Button>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right">
                    <p>Logout</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </aside>
      </TooltipProvider>

      <div className="flex-1 overflow-auto">
        {/* Navbar */}
        <header className="bg-background w-full h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-8">
              {!isOpen && (
                <Button onClick={toggleSidebar} variant="ghost" size="icon">
                  <PanelLeftOpenIcon className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center space-x-2 absolute tpo-4 right-8">
                <User className="w-4 h-4" />
                <span className="font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content based on role */}
        <main className="border-2 border-gray-200 rounded-2xl">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
