'use client';

import { useRouter } from 'next/navigation';
import type { PublicUser } from '@todosday/shared';
import { clearToken } from '@/lib/auth';

export default function Header({ user }: { user: PublicUser }) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <header className="header">
      <span className="brand">Todosday</span>
      <div className="header-right">
        <span className="muted">Hai, {user.name ?? user.email}</span>
        <button type="button" className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
