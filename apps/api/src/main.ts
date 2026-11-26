import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOrigins, env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.listen(env.PORT);
  console.log(`API berjalan di http://localhost:${env.PORT}`);
}

bootstrap().catch((error) => {
  console.error('Gagal menjalankan aplikasi:', error);
  process.exit(1);
});
