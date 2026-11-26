import { z } from 'zod';

// ---------- Todo ----------

export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul wajib diisi')
    .max(200, 'Judul maksimal 200 karakter'),
  description: z
    .string()
    .trim()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul wajib diisi')
    .max(200, 'Judul maksimal 200 karakter')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
  completed: z.boolean().optional(),
});
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/** Bentuk Todo yang dikirim API lewat JSON (tanggal sudah berupa string ISO). */
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------- Auth ----------

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100).optional(),
  email: z.email('Email tidak valid').max(255),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Data user yang aman dikirim ke klien (tanpa hash password). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
