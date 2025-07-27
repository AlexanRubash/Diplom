import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path'; // Импорт path для работы с путями

import { AppModule } from '../src/app.module';

async function bootstrap() {
  // Создание HTTPS сервера с использованием ключа и сертификата
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../certs/LAB.key')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/LAB.crt')),
  };
  console.log(httpsOptions);
  // Создание Nest.js приложения с HTTP адаптером и параметрами HTTPS
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(cors({ credentials: true, origin: 'https://localhost:3000' }));

  const configService: ConfigService = app.get(ConfigService);
  const PORT: number = configService.get('APP_PORT');
  const HOST: string = configService.get('APP_HOST');

  await app.listen(PORT, () => {
    console.log(`Server launched on host: ${HOST}:${PORT}`);
  });
}

bootstrap();
