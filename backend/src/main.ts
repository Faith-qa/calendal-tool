import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Enable shutdown hooks
  app.enableShutdownHooks();
  
  // Use Pino logger
  app.useLogger(app.get(Logger));
  
  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
