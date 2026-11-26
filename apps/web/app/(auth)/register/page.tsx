'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, type AuthResponse } from '@todosday/shared';
import { ApiError, apiFetch } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({
      name: name.trim() || undefined,
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Input tidak valid');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch<AuthResponse>('/auth/register', {
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
        <h1>Daftar</h1>
        <p className="subtitle">Buat akun untuk mulai mencatat todo</p>
        {error && <p className="error-banner">{error}</p>}
        <label className="field">
          <span>Nama (opsional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            autoComplete="name"
          />
        </label>
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
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Memproses…' : 'Daftar'}
        </button>
        <p className="switch">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      </form>
    </main>
  );
}
