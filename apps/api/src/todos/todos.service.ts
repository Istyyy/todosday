import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@todosday/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Bentuk model Todo yang dikembalikan Prisma (tanggal berupa Date). */
type PrismaTodo = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serializeTodo(todo: PrismaTodo): Todo {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return todos.map(serializeTodo);
  }

  async create(userId: string, input: CreateTodoInput): Promise<Todo> {
    const todo = await this.prisma.todo.create({
      data: { ...input, userId },
    });
    return serializeTodo(todo);
  }

  async update(userId: string, id: string, input: UpdateTodoInput): Promise<Todo> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('Tidak ada data yang diubah');
    }
    await this.assertOwnership(userId, id);
    const todo = await this.prisma.todo.update({
      where: { id },
      data: input,
    });
    return serializeTodo(todo);
  }

  async remove(userId: string, id: string): Promise<Todo> {
    await this.assertOwnership(userId, id);
    const todo = await this.prisma.todo.delete({ where: { id } });
    return serializeTodo(todo);
  }

  /** Pastikan todo ada dan milik user yang sedang login. */
  private async assertOwnership(userId: string, id: string): Promise<void> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!todo || todo.userId !== userId) {
      throw new NotFoundException('Todo tidak ditemukan');
    }
  }
}
