'use client';

import type { Todo, UpdateTodoInput } from '@todosday/shared';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => Promise<void>;
  onEdit: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (todo: Todo) => Promise<void>;
}

export default function TodoList({ todos, onToggle, onEdit, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty">Belum ada todo. Tambahkan yang pertama!</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
