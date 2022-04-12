import {Repository} from 'typeorm';
import {Message as MessagesEntity} from './messages.entity';
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import {messagePayloadDto} from "./messagePayload.dto";
import {UsersService} from "../usersModule/users.service";
import {Room} from "../roomsModule/rooms.entity";

@Injectable()
export class MessagesService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(MessagesEntity)
    private messagesRepository: Repository<MessagesEntity>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>
  ) {}

  createMessage = async (payload: messagePayloadDto) => {
    const newMessage = await this.messagesRepository.create({
      roomId: payload.roomId,
      senderId: payload.id,
      senderUsername: payload.username,
      message: payload.message,
      sendingDate: Date.now().toString()
    })
    return await this.messagesRepository.save(newMessage);
  }

  getAllRoomMessages = async (roomId: string) => {
    return await this.messagesRepository.find({roomId});
  }

  async getLastMessages(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (user === 'user not found') return 'smthWrong'
    const lastMessages = {};
    await Promise.all(user.groupRooms.map(async id => {
      const messages = await this.getAllRoomMessages(id);
      if (messages.length > 1) {
        lastMessages[id] = messages.sort((a, b) => Number(a.sendingDate) - Number(b.sendingDate))[messages.length - 1];
      } else if (messages.length === 1) {
        lastMessages[id] = messages[0];
      } else {
        lastMessages[id] = {message: null};
      }
    }));
    const friendRoomsParticipants = user.friends.map(id => [id, userId].sort().toString())
    await Promise.all(friendRoomsParticipants.map(async participants => {
      const room = await this.roomsRepository.findOne({participants});
      if (!room) return null
      const messages = await this.getAllRoomMessages(room.roomId);
      const lastMessage = messages.sort((a, b) => Number(a.sendingDate) - Number(b.sendingDate))[messages.length - 1];
      if (messages.length > 1) {
        lastMessages[room.roomId] = lastMessage;
      } else if (messages.length === 1) {
        lastMessages[room.roomId] = lastMessage;
      } else {
        lastMessages[room.roomId] = {message: null};
      }
    }))
    return lastMessages;
  }
}