import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { usersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {MulterModule} from "@nestjs/platform-express";
import {FriendRequest} from "./friendRequest.entity";
import {Room} from "../roomsModule/rooms.entity";
import {Message} from "../messagesModule/messages.entity";
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, FriendRequest, Room, Message]),
    MulterModule.register(
      {
        dest: './UsersImages',
      }
    ),
  ],
  providers: [UsersService],
  controllers: [usersController],
  exports: [UsersService],
})
export class UsersModule {}
