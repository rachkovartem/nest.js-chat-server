import { Module } from '@nestjs/common';
import { Room } from "./rooms.entity";
import { roomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {User} from "../usersModule/user.entity";
import {UsersModule} from "../usersModule/users.module";
import {MessagesModule} from "../messagesModule/messages.module";

@Module({
  imports: [TypeOrmModule.forFeature([Room, User]), UsersModule, MessagesModule],
  providers: [RoomsService],
  controllers: [roomsController],
  exports: [RoomsService],
})
export class RoomsModule {}