import {Injectable} from '@nestjs/common';
import {CreateUserDto} from './createUser.dto';
import {InjectRepository} from '@nestjs/typeorm';
import {ILike, Repository} from 'typeorm';
import {User as UserEntity} from './user.entity';
import {FriendRequest as FriendRequestEntity} from './friendRequest.entity';
import * as bcrypt from 'bcrypt';
import {Room as RoomsEntity} from "../roomsModule/rooms.entity";
import {Message as MessageEntity} from "../messagesModule/messages.entity";
import * as fs from "fs";
import ImageKit from "imagekit";

export type User = any;

interface newItem {
  password: string;
  username: string;
  registration: string;
  email: string;
  imagePath: string;
  groupRooms: string[];
  friends: string[];
  friendsRequests: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,

    @InjectRepository(FriendRequestEntity)
    private friendRequestRepository: Repository<FriendRequestEntity>,

    @InjectRepository(RoomsEntity)
    private roomsRepository: Repository<RoomsEntity>,

    @InjectRepository(MessageEntity)
    private messagesRepository: Repository<MessageEntity>,
  ) {}

  createUser = async (item: CreateUserDto) => {
    const existEmail = await this.usersRepository.find({ email: item.email });
    const existUsername = await this.usersRepository.find({
      username: item.username,
    });
    if (existEmail.length === 0 && existUsername.length === 0) {
      const newItem: newItem = {
        registration: '',
        imagePath: '',
        friends: [],
        friendsRequests: [],
        groupRooms: [],
        ...item,
      };
      newItem.password = await bcrypt.hash(item.password, 10);
      newItem.registration = Date.now().toString();
      const newUser = this.usersRepository.create(newItem);
      const result = await this.usersRepository.save(newUser);
      return { status: 'successfully', id: result.id };
    } else {
      return { status: 'already exist' };
    }
  };

  async findOne(email: string): Promise<User | undefined> {
    return await this.usersRepository.findOne({ email });
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({ id });
    if (!user) return 'user not found'
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
    return { ...user, objFriends, fullGroupRooms: groupRooms, friendsRoomsIds };
  }

  async getAllUsers() {
    return await this.usersRepository.find();
  }

  async updateUserImage(id: string, imagePath: string, imagekit: ImageKit) {
      try {
        const updateRes = await this.usersRepository.update({ id }, { imagePath });
        console.log(updateRes)
      }
      catch (error) {
         return 'smthWrong'
      }
  }

  async removeFriend(idUser: string, idFriend: string) {
    const user = await this.usersRepository.findOne({ id: idUser } );
    const friend = await this.usersRepository.findOne({ id: idFriend } );
    const resUser = await this.usersRepository
      .update(
        { id: idUser },
        { friends: user.friends.filter(id => id !== idFriend) }
      );
    const resFriend = await this.usersRepository
      .update(
        { id: idFriend },
        { friends: friend.friends.filter(id => id !== idUser) }
      );
    const room = await this.roomsRepository.findOne({participants: [idUser, idFriend].sort().toString()});
    if (room) {
      const messages = await this.messagesRepository.find({roomId: room.roomId});
      await this.messagesRepository.remove(messages);
      await this.roomsRepository.delete({roomId: room.roomId});
    }
    const userAfterDeleting = await this.getUserById(idUser);
      if (resUser.affected === 1 && resFriend.affected === 1 && userAfterDeleting !== 'user not found') {
        return {text: 'friendDeleted', objFriends: userAfterDeleting.objFriends}
      } else {
        return 'smthWrong'
      }
  }

  async friendRequest(idSender: string, idRecipient: string) {
    const res1 = await this.friendRequestRepository.find({
      userSenderId: idSender,
      userRecipientId: idRecipient,
    });
    const res2 = await this.friendRequestRepository.find({
      userSenderId: idRecipient,
      userRecipientId: idSender,
    });
    const sender = await this.usersRepository.findOne({id: idSender});
    const res3 = sender.friends.some(id => id === idRecipient);
    if (res1.length === 0 && res2.length === 0 && !res3) {
      const newReq = this.friendRequestRepository.create({
        userSenderId: idSender,
        userRecipientId: idRecipient,
        userRecipientStatus: false,
      });
      const res = await this.friendRequestRepository.save(newReq);
      const sender = await this.usersRepository.findOne({ id: idSender });
      const recipient = await this.usersRepository.findOne({ id: idRecipient });
      const resUpdateSender = await this.usersRepository.update(
        { id: idSender },
        { friendsRequests: [...sender.friendsRequests, res.id] },
      );
      const resUpdateRecipient = await this.usersRepository.update(
        { id: idRecipient },
        { friendsRequests: [...recipient.friendsRequests, res.id] },
      );
      const senderResult = await this.usersRepository.findOne({ id: idSender });
      const reqs = await this.getRequests(senderResult.friendsRequests, idSender);
      return {text: 'reqSended', outReqs: reqs.outReqs};
    } else if (res1.length > 0) {
      return 'requestExist';
    } else if (res2.length > 0) {
      return 'userAlreadySend';
    } else if (res3) {
      return 'userAlreadyFriend'
    }
  }

  async getRequests(friendReqsArr: string[], userId: string) {
    const allRequests = await Promise.all(
      friendReqsArr.map(async (id) => {
        return await this.friendRequestRepository.findOne({ id });
      }),
    );
    const inReqs = [];
    const outReqs = [];
    for (const req of allRequests) {
      if (req.userSenderId === userId) {
        const user = await this.usersRepository.findOne({
          id: req.userRecipientId,
        });
        const result = { ...req, recipient: user };
        outReqs.push(result);
      } else {
        const user = await this.usersRepository.findOne({
          id: req.userSenderId,
        });
        const result = { ...req, sender: user };
        inReqs.push(result);
      }
    }
    return { inReqs, outReqs };
  }

  async approveFriendReq(idUser: string, idFriend: string, idReq: string) {
    const resDelete = await this.friendRequestRepository.delete({ id: idReq });
    const user = await this.usersRepository.findOne({ id: idUser });
    const friend = await this.usersRepository.findOne({ id: idFriend });
    const resUpdateUser = await this.usersRepository.update(
      { id: idUser },
      {
        friends: [...user.friends, idFriend],
        friendsRequests: user.friendsRequests.filter(
          (reqId) => reqId !== idReq,
        ),
      },
    );
    const resUpdateFriend = await this.usersRepository.update(
      { id: idFriend },
      {
        friends: [...friend.friends, idUser],
        friendsRequests: friend.friendsRequests.filter(
          (reqId) => reqId !== idReq,
        ),
      },
    );
    if (resDelete.affected === 1 && resUpdateUser.affected === 1 && resUpdateFriend.affected === 1) {
      const user =  await this.getUserById(idUser);
      if (user === 'user not found') return 'smthWrong'
      const reqs = await this.getRequests(user.friendsRequests, idUser);
      return {objFriends: user.objFriends, ...reqs}
    } else return 'smthWrong'
  }

  async rejectFriendReq(idUser: string, idFriend: string, idReq: string) {
    const resDelete = await this.friendRequestRepository.delete({ id: idReq });
    const user = await this.usersRepository.findOne({ id: idUser });
    const friend = await this.usersRepository.findOne({ id: idFriend });
    const resUpdateUser = await this.usersRepository.update(
      { id: idUser },
      {
        friendsRequests: user.friendsRequests.filter(
          (reqId) => reqId !== idReq,
        ),
      },
    );
    const resUpdateFriend = await this.usersRepository.update(
      { id: idFriend },
      {
        friendsRequests: friend.friendsRequests.filter(
          (reqId) => reqId !== idReq,
        ),
      },
    );
    if (resDelete.affected === 1 && resUpdateUser.affected === 1 && resUpdateFriend.affected === 1) {
      const user =  await this.getUserById(idUser);
      if (user === 'user not found') return 'smthWrong'
      const reqs = await this.getRequests(user.friendsRequests, idUser);
      return { ...reqs };
    } else {
      return 'smthWrong'
    }
  }

  async findUser(option: string, id: string) {
    const res = await this.usersRepository.find({
      where: [
        { username: ILike(`%${option}%`) },
        { email: ILike(`%${option}%`) },
      ],
    });
    return res.filter(item => item.id !== id);
  }
}
