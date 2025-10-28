import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    // origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    origin: [
      'http://47.128.81.163',
      'http://localhost',
      'http://localhost:80',
      'https://localhost:443',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default dev port
      'http://localhost:5174', // optional, if Vite picks next port
      'http://localhost:5175', // optional
      'http://localhost:5176', // your current frontend
    ],
    // origin: '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Movie Streaming API')
    .setDescription(
      'REST API for movie streaming platform with role-based access control',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Movies', 'Movie management and streaming endpoints')
    .addTag('Subscriptions', 'User subscription management')
    .addTag('Roles', 'Role management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Movie API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
