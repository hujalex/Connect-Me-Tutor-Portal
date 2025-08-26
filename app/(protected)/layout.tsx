import { Inter } from "next/font/google";

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
  const supabase = createClientComponentClient();
  const {
    data: { user },

    error,
  } = await supabase.auth.getUser();

  console.log("USER", error);

  const userId = user ? user.id : "";
  console.log("USER ID", user, "Layout");
  const data = await getProfile(userId);

  return <div className="flex-col h-full w-full m-auto">{children}</div>;
}
