import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from '@rnest/database';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* Global validation pipe */
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  /* Enable CORS */
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    credentials: true,
  });

  /* Global prefix */
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 3333;
  const host = process.env.HOST || 'localhost';

  await app.listen(port, host);

  Logger.log(`Application is running on ${host}:${port}/${globalPrefix}`);
}

bootstrap();
