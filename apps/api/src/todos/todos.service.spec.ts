import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TodosService } from './todos.service';

describe('TodosService', () => {
  let service: TodosService;

  const prisma = {
    todo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [TodosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get<TodosService>(TodosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create menambahkan userId dari user yang login', async () => {
    const now = new Date();
    prisma.todo.create.mockResolvedValue({
      id: 't1',
      title: 'Belajar NestJS',
      description: null,
      completed: false,
      userId: 'u1',
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.create('u1', { title: 'Belajar NestJS' });

    expect(result.title).toBe('Belajar NestJS');
    expect(result.createdAt).toBe(now.toISOString());
    expect(prisma.todo.create).toHaveBeenCalledWith({
      data: { title: 'Belajar NestJS', userId: 'u1' },
    });
  });

  it('update todo milik user lain melempar NotFoundException', async () => {
    prisma.todo.findUnique.mockResolvedValue({ userId: 'user-lain' });

    await expect(
      service.update('u1', 't1', { completed: true }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.todo.update).not.toHaveBeenCalled();
  });

  it('findAll hanya mengambil todo milik user tersebut', async () => {
    prisma.todo.findMany.mockResolvedValue([]);

    await service.findAll('u1');

    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
