import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & Todos (e2e)', () => {
  let app: INestApplication;
  /** Email user yang dibuat selama test; dihapus di afterAll agar DB tidak menumpuk data uji. */
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Harus selesai sebelum app.close() (PrismaService ter-disconnect saat itu).
    await app
      .get(PrismaService)
      .user.deleteMany({ where: { email: { in: createdEmails } } });
    await app.close();
  });

  it('alur lengkap: register → login → CRUD todo', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'rahasia-aman-123';
    createdEmails.push(email);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Tester E2E', email, password })
      .expect(201);
    expect(registerRes.body.accessToken).toBeDefined();
    expect(registerRes.body.user.email).toBe(email);
    const token: string = registerRes.body.accessToken;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    expect(loginRes.body.accessToken).toBeDefined();

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meRes.body.email).toBe(email);

    await request(app.getHttpServer())
      .get('/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([]);

    const createRes = await request(app.getHttpServer())
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Todo dari e2e', description: 'deskripsi opsional' })
      .expect(201);
    expect(createRes.body.title).toBe('Todo dari e2e');
    const todoId: string = createRes.body.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(200);
    expect(patchRes.body.completed).toBe(true);

    await request(app.getHttpServer())
      .delete(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([]);
  });

  it('menolak akses /todos tanpa token (401)', async () => {
    await request(app.getHttpServer()).get('/todos').expect(401);
  });

  it('menolak register dengan email duplikat (409)', async () => {
    const email = `dup-${Date.now()}@example.com`;
    createdEmails.push(email);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'rahasia-aman-123' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'rahasia-aman-123' })
      .expect(409);
  });
});
