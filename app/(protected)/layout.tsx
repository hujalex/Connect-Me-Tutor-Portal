import { Inter } from "next/font/google";
// import { supabase } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client";

import { redirect } from "next/navigation";

import { getProfile } from "@/lib/actions/user.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dashboard | ConnectMe",
  description: "Instructors can create courses here",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-col h-full w-full m-auto">{children}</div>;
}
