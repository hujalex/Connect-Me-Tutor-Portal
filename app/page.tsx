// app/page.tsx

import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to Connect Me's Tutoring Platform</h1>
      <Link href="/login">Login</Link>
      <Link href="/register">Register</Link>
    </div>
  );
}