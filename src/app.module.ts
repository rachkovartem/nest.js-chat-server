import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './authModule/auth.service';
import { UsersService } from './usersModule/users.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './authModule/constants';
import { AuthModule } from './authModule/auth.module';
import { UsersModule } from './usersModule/users.module';
import { MessagesModule } from './messagesModule/messages.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './ormconfig';
import { User } from './usersModule/user.entity';
import { RoomsModule } from './roomsModule/rooms.module';
import { FriendRequest } from './usersModule/friendRequest.entity';
import {Room} from "./roomsModule/rooms.entity";
import {Message} from "./messagesModule/messages.entity";
import {ConfigModule} from "@nestjs/config";
import {PushModule} from "./pushModule/push.module";
import {Push} from "./pushModule/push.entity";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(config),
    AuthModule,
    UsersModule,
    RoomsModule,
    MessagesModule,
    PushModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '86400s' },
      secretOrPrivateKey: jwtConstants.secret,
    }),
    TypeOrmModule.forFeature([User, FriendRequest, Room, Message, Push]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    UsersService
  ],
})
export class AppModule {}
