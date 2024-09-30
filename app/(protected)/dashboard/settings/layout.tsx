import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "User Settings",
  description: "Manage your account settings and preferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex">
          <SettingsSidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}