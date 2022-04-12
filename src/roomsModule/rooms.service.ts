import {Repository} from 'typeorm';
import {Room as RoomsEntity} from './rooms.entity';
import {InjectRepository} from "@nestjs/typeorm";
import {Injectable} from "@nestjs/common";
import {User as UserEntity} from "../usersModule/user.entity";
import {UsersService} from "../usersModule/users.service";
import {MessagesService} from "../messagesModule/messages.service";


@Injectable()
export class RoomsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    @InjectRepository(RoomsEntity)
    private roomsRepository: Repository<RoomsEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async createRoom (participants: string[]) {
    const res = await this.roomsRepository.find({participants: participants.sort().toString()})
    if (res.length === 0) {
      const newRoom = this.roomsRepository.create({
        participants: participants.sort().toString(),
        groupRoom: false,
        creationDate: Date.now().toString()
      })
      return await this.roomsRepository.save(newRoom);
    } else if (res.length === 1) {
      return res[0]
    } else {
      console.log('error, found more then 1 room');
      return 'error, found more then 1 room';
    }
  }

  async createGroupRoom(participants: {username: string, id: string}[], idUser: string) {
    if (participants.length < 3) {
      return 'threeOrMore'
    }
    const participantsIds = participants.map(member => member.id).sort().toString();
    const res = await this.roomsRepository.find({participants: participantsIds});
    if (res.length === 0) {
      const newRoom = await this.roomsRepository.create({
        participants: participantsIds,
        groupRoom: true,
        creationDate: Date.now().toString()
      });
      const roomRes = await this.roomsRepository.save(newRoom);
      await Promise.all(participants.map(async user => {
        const profile = await this.usersRepository.findOne({ id: user.id })
        const newRooms = [...profile.groupRooms, roomRes.roomId];
        await this.usersRepository.update({id: user.id}, { groupRooms: newRooms})
      }))
      const userAfterUpdate = await this.usersService.getUserById(idUser);
      if (userAfterUpdate === 'user not found') return 'smthWrong'
      return {roomRes, fullGroupRooms: userAfterUpdate.fullGroupRooms};
    } else if (res.length === 1 && !res[0].groupRoom) {
      return res[0]
    } else if (res.length === 1 && res[0].groupRoom) {
      return 'groupAlreadyExists'
    } else {
      console.log('error, found more then 1 room');
      return 'smthWrong';
    }
  }

  async getAllRoomsIds(idUser: string) {
    const user = await this.usersRepository.findOne({id: idUser});
    const roomsIds = [];
    await Promise.all(user.friends.map(async idFriend => {
      const room = await this.roomsRepository.findOne({
        participants: [idUser, idFriend].sort().toString()
      })
      if (room) {
        roomsIds.push(room.roomId);
      }
    }));
    return roomsIds.concat(user.groupRooms)

  }

  async getRoomInfo(roomId: string) {
    const room = await this.roomsRepository.findOne({roomId});
    if (!room) return null
    const participants = await Promise.all(room.participants.split(',').map(async id => {
      return await this.usersRepository.findOne({id})
    }));
    const avatars = {};
    participants.forEach(user => {
      avatars[user.id] = user.imagePath
    })
    return {...room, participants, avatars}
  }

  async getLastMessages(userId: string) {
    const user = await this.usersService.getUserById(userId);
    if (user === 'user not found') return 'smthWrong'
    const lastMessages = {};
    await Promise.all(user.groupRooms.map(async id => {
      const messages = await this.messagesService.getAllRoomMessages(id);
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
      const messages = await this.messagesService.getAllRoomMessages(room.roomId);
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

  async getAllUserRooms(id: string) {
    const user = await this.usersRepository.findOne({ id });
    const objFriends = await Promise.all(user.friends.map(async id => await this.usersRepository.findOne({ id })));
    const groupRooms = await Promise.all(user.groupRooms.map(async roomId => {
      const groupChat = await this.roomsRepository.findOne({ roomId });
      const groupChatUsers = await Promise.all(groupChat.participants.split(',').map(async (id) => {
        return await this.usersRepository.findOne({id});
      }))
      return { ...groupChat, fullParticipants: groupChatUsers };
    }))
    const friendsRoomsIds = {};
    await Promise.all(user.friends.map(async friendId => {
      const participants = [friendId, id].sort().toString();
      const room = await this.roomsRepository.findOne({participants})
      friendsRoomsIds[friendId] = room ? room.roomId : null
    }))
    const friendsRooms = objFriends
      .map(friend => {
        const obj = {...friend, roomId: '', groupRoom: false}
        obj.roomId = friendsRoomsIds[friend.id]
        return obj
      })
      .filter(room => room.id !== id)
    const lastMessages = await this.getLastMessages(id);
    const rooms = [...friendsRooms, ...groupRooms].map(room => {
      const newRoom = {...room, lastMessage: ''}
      newRoom.lastMessage = lastMessages[newRoom.roomId];
      return newRoom
    });
    return rooms.sort((a: any, b: any) => {
      const aDate = lastMessages[a.roomId]?.sendingDate || 0;
      const bDate = lastMessages[b.roomId]?.sendingDate || 0;
      if (b.roomId in lastMessages) {
        return (Number(bDate) - Number(aDate))
      } else {return 0}
    })
  }
}