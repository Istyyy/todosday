'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, type AuthResponse } from '@todosday/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Input tidak valid');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: parsed.data,
        auth: false,
        redirectOn401: false,
      });
      setToken(res.accessToken);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Masuk</h1>
        <p className="subtitle">Kelola todo harianmu di Todosday</p>
        {error && <p className="error-banner">{error}</p>}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
        <p className="switch">
          Belum punya akun? <Link href="/register">Daftar</Link>
        </p>
      </form>
    </main>
  );
}
