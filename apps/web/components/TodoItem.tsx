'use client';

import { useState, type FormEvent } from 'react';
import type { Todo, UpdateTodoInput } from '@todosday/shared';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (todo: Todo) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEditing() {
    setTitle(todo.title);
    setDescription(todo.description ?? '');
    setError('');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError('');
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onEdit(todo.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setEditing(false);
    } catch {
      setError('Gagal menyimpan perubahan.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus "${todo.title}"?`)) return;
    setBusy(true);
    try {
      await onDelete(todo);
    } catch {
      setError('Gagal menghapus todo.');
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="todo-item">
        <form className="edit-form" onSubmit={handleSave}>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Judul todo"
            required
          />
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi (opsional)"
            aria-label="Deskripsi todo"
          />
          {error && <p className="error-banner">{error}</p>}
          <div className="row-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Simpan
            </button>
            <button type="button" className="btn" onClick={cancelEditing} disabled={busy}>
              Batal
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`todo-item${todo.completed ? ' done' : ''}`}>
      <label className="todo-main">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => {
            void onToggle(todo);
          }}
        />
        <span className="todo-texts">
          <span className="todo-title">{todo.title}</span>
          {todo.description && <span className="todo-desc">{todo.description}</span>}
        </span>
      </label>
      <div className="row-actions">
        <button
          type="button"
          className="btn btn-icon"
          onClick={startEditing}
          aria-label={`Edit ${todo.title}`}
          title="Edit"
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => {
            void handleDelete();
          }}
          disabled={busy}
          aria-label={`Hapus ${todo.title}`}
          title="Hapus"
        >
          🗑️
        </button>
      </div>
      {error && <p className="error-banner">{error}</p>}
    </li>
  );
}
