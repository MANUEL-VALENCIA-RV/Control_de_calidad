import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permite peticiones server-to-server/curl sin Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Render asigna PORT dinámicamente. En local usa 3001.
  const port = Number(process.env.PORT ?? 3001);
  const host = '0.0.0.0';

  await app.listen(port, host);

  console.log(`Calidad API escuchando en ${host}:${port}`);
  console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);

  // Evita que Render duerma el servicio (plan free) haciendo ping cada 10 min.
  const externalUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (externalUrl) {
    setInterval(() => {
      fetch(`${externalUrl}/`)
        .then((res) =>
          console.log(`Keep-alive ping: ${res.status}`),
        )
        .catch(() => {});
    }, 10 * 60 * 1000).unref();
  }
}

void bootstrap();
