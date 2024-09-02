import Link from "next/link";

const menuItems = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Account", href: "/settings/account" },
  { name: "Appearance", href: "/settings/appearance" },
  { name: "Notifications", href: "/settings/notifications" },
  { name: "Display", href: "/settings/display" },
];

export function SettingsSidebar() {
  return (
    <nav className="w-64 bg-gray-100 p-4">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <ul>
        {menuItems.map((item) => (
          <li key={item.name} className="mb-2">
            <Link href={item.href} className="text-blue-600 hover:underline">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}