import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

const corsOptions = {
  origin: ['https://nextchat-app.herokuapp.com', 'http://localhost:3000', '193.176.84.208', 'http://192.168.100.22:3000'],
  credentials: true,
  optionSuccessStatus: 200,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  app.use(cookieParser());
  await app.listen(process.env.PORT || 8080, () => console.log(process.env.PORT || 8080));
}
bootstrap();