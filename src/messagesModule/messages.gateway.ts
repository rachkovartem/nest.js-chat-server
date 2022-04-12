import {
  MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import {MessagesService} from "./messages.service";
import { Socket, Server } from 'socket.io';
import {Logger, Req} from "@nestjs/common";
import {messagePayloadDto} from "./messagePayload.dto";
import {JwtAuthGuard} from "../authModule/guards/jwt-auth.guard";
import {UseGuards} from "@nestjs/common";
import {UsersService} from "../usersModule/users.service";

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
    serveClient: false,
  },
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {
  }

  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private online = [];

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('system:connect')
  async connection(client: Socket) {
    const clientId = client.handshake.query.id;
    const user = await this.usersService.getUserById(clientId.toString());
    if (user === 'user not found') return
    const friendsOnline = user.friends.filter(friendId => this.online.some(id => id === friendId));
    this.server.to(clientId).emit('friends:online', friendsOnline);
    user.groupRooms.forEach(id => client.join(id))
    user.friends.forEach(id => {
      if (user.friendsRoomsIds[id]) {
        client.join(user.friendsRoomsIds[id])
      }
    })
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('messages:add')
  async handleMessage(client: Socket, payload: messagePayloadDto) {
    const result = await this.messagesService.createMessage(payload);
    const sender = await this.usersService.getUserById(result.senderId);
    if (sender === 'user not found') return
    this.server.to(payload.roomId).emit(`messages:add`, [{...result, senderAvatar: sender.imagePath}]);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(`messages:get`)
  async getMessage(client: Socket, payload) {
    const clientId = client.handshake.query.id;
    const messages = await this.messagesService.getAllRoomMessages(payload.roomId);
    this.server.to(payload.roomId).emit(`messages:get${clientId}`, [...messages]);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('messages:getLastMessages')
  async getLastMessages(client: Socket) {
    const clientId = client.handshake.query.id;
    const messages = await this.messagesService.getLastMessages(clientId.toString())
    this.server.to(clientId).emit(`messages:getLastMessages${clientId}`, messages);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('friends:online')
  async getFriendsOnline(client: Socket) {
    const clientId = client.handshake.query.id;
    client.join(clientId);
    const user = await this.usersService.getUserById(clientId.toString());
    if (user === 'user not found') return
    const friendsOnline = user.friends.filter(friendId => this.online.some(id => id === friendId));
    this.server.to(clientId).emit('friends:online', friendsOnline);
  }


  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleDisconnect(client: Socket) {
    const clientId = client.handshake.query.id;
    this.logger.log(`Client disconnected: ${clientId}`);
    const user = await this.usersService.getUserById(clientId.toString());
    if (user === 'user not found') return
    if (this.online.includes(clientId)) {
      this.online.splice(this.online.indexOf(clientId), 1);
    }
    user.friends.map(id => this.server.to(id).emit('friends:wentOffline', clientId))
  }

  @UseGuards(JwtAuthGuard)
  async handleConnection(client: Socket, ...args: any[]) {
    const clientId = client.handshake.query.id;
    client.join(clientId);
    const user = await this.usersService.getUserById(clientId.toString());
    if (user === 'user not found') return
    this.logger.log(`Client connected: ${clientId}`);
    if (!this.online.includes(clientId)) {
      this.online.push(clientId);
    }
    user.friends.map(id => this.server.to(id).emit('friends:wentOnline', clientId))
  }
}