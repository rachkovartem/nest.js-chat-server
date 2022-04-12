import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Message} from "./messages.entity";
import {MessagesService} from "./messages.service";
import {UsersModule} from "../usersModule/users.module";
import {Room} from "../roomsModule/rooms.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room]),
    UsersModule,
  ],
  controllers: [],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}