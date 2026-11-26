'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CreateTodoInput,
  PublicUser,
  Todo,
  UpdateTodoInput,
} from '@todosday/shared';
import Header from '@/components/Header';
import AddTodoForm from '@/components/AddTodoForm';
import TodoList from '@/components/TodoList';
import { ApiError, apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    async function loadInitialData() {
      try {
        const [me, list] = await Promise.all([
          apiFetch<PublicUser>('/auth/me'),
          apiFetch<Todo[]>('/todos'),
        ]);
        if (cancelled) return;
        setUser(me);
        setTodos(list);
        setError('');
      } catch (err) {
        // 401 sudah ditangani apiFetch (hapus token + redirect ke /login)
        if (err instanceof ApiError && err.status === 401) return;
        if (!cancelled) setError('Gagal memuat data. Coba muat ulang halaman.');
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleAdd(input: CreateTodoInput) {
    const todo = await apiFetch<Todo>('/todos', { method: 'POST', body: input });
    setTodos((prev) => (prev ? [todo, ...prev] : [todo]));
  }

  async function handleToggle(todo: Todo) {
    const updated = await apiFetch<Todo>(`/todos/${todo.id}`, {
      method: 'PATCH',
      body: { completed: !todo.completed },
    });
    setTodos((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? null);
  }

  async function handleEdit(id: string, input: UpdateTodoInput) {
    const updated = await apiFetch<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: input,
    });
    setTodos((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? null);
  }

  async function handleDelete(todo: Todo) {
    await apiFetch<Todo>(`/todos/${todo.id}`, { method: 'DELETE' });
    setTodos((prev) => prev?.filter((t) => t.id !== todo.id) ?? null);
  }

  return (
    <div className="page">
      {user && <Header user={user} />}
      <main className="container">
        <AddTodoForm onAdd={handleAdd} />
        {error && <p className="error-banner">{error}</p>}
        {todos === null ? (
          <p className="muted">Memuat…</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
