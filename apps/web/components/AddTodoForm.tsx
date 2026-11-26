'use client';

import { useState, type FormEvent } from 'react';
import { createTodoSchema, type CreateTodoInput } from '@todosday/shared';

interface AddTodoFormProps {
  onAdd: (input: CreateTodoInput) => Promise<void>;
}

export default function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = createTodoSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Input tidak valid');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onAdd(parsed.data);
      setTitle('');
      setDescription('');
    } catch {
      setError('Gagal menambah todo. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Apa yang mau dikerjakan?"
        aria-label="Judul todo"
      />
      <input
        className="input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Deskripsi (opsional)"
        aria-label="Deskripsi todo"
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitting || title.trim().length === 0}
      >
        {submitting ? 'Menyimpan…' : 'Tambah'}
      </button>
      {error && <p className="error-banner">{error}</p>}
    </form>
  );
}
