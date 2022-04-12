import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from './createUser.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../authModule/guards/jwt-auth.guard';
import {ConfigService} from "@nestjs/config";
const fs = require('fs');
const ImageKit =  require ("imagekit");

@Controller()
export class usersController {
  constructor(
    private readonly usersService: UsersService,
    private configService: ConfigService,
  ) {}

  @Post('/register')
  createItem(@Body() user: CreateUserDto) {
    return this.usersService.createUser(user);
  }

  @Get('/getUserById')
  getUserById(@Req() req, @Query('id') id) {
    const headers = 'headers' in req ? req.headers : req.handshake.headers
    if (
      headers.host === 'localhost:8080' ||
      headers.host === 'nestchat-server.herokuapp.com' ||
      headers.host === '192.168.100.22:8080'
    ) {
      return this.usersService.getUserById(id);
    }
    throw new ForbiddenException();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/removeFriend')
  @UseInterceptors(FileInterceptor('file'))
  async removeFriend(@Body('idUser') idUser: string, @Body('idFriend') idFriend: string,) {
      return await this.usersService.removeFriend(idUser, idFriend)
  }


  @UseGuards(JwtAuthGuard)
  @Post('/uploadImage')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const imagekit = new ImageKit(
     {
        publicKey : this.configService.get<string>('PUBLIC_KEY'),
        privateKey : this.configService.get<string>('PRIVATE_KEY'),
        urlEndpoint : this.configService.get<string>('IMAGEKIT_URL')
     })

    if (file) {
      const base64 = fs.readFileSync(file.path, {encoding: 'base64'});

      const imagekitRes = await imagekit.upload({
        file: base64,
        fileName: file.filename
      });

      const res = await this.usersService.updateUserImage(
        req.user.id,
        imagekitRes.url,
        imagekit
      );
      fs.unlink(file.path, (err) => {
        if (err) throw err;
      });
      return { path: imagekitRes.url, result: res };
    }
  }

  @Get('/UsersImages/:filename')
  async getFile(
    @Param('filename') filename: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    res.sendFile(filename, { root: 'UsersImages' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/friendRequest')
  async friendRequest(
    @Body('idUser') idUser: string,
    @Body('idFriend') idFriend: string,
  ) {
    return await this.usersService.friendRequest(idUser, idFriend);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/approveFriendReq')
  async approveFriendReq(
    @Body('idUser') idUser: string,
    @Body('idFriend') idFriend: string,
    @Body('idReq') idReq: string,
  ) {
    return await this.usersService.approveFriendReq(idUser, idFriend, idReq);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/rejectFriendReq')
  async rejectFriendReq(
    @Body('idUser') idUser: string,
    @Body('idFriend') idFriend: string,
    @Body('idReq') idReq: string,
  ) {
    return await this.usersService.rejectFriendReq(idUser, idFriend, idReq);
  }

  @Post('/getRequests')
  async getRequest(
    @Body('friendReqsArr') friendReqsArr: string[],
    @Body('userId') userId: string,
    @Req() req,
  ) {
    const headers = 'headers' in req ? req.headers : req.handshake.headers
    if (
      headers.host === 'localhost:8080' ||
      headers.host === 'nestchat-server.herokuapp.com' ||
      headers.host === '192.168.100.22:8080'
    ) {
      return await this.usersService.getRequests(friendReqsArr, userId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/findUser')
  async findUser(@Query('option') option: string, @Query('id') id: string) {
    if (option.length === 0) {
      return []
    }
    return await this.usersService.findUser(option, id);
  }

  @Get('/allUsers')
  getAllUsers(@Req() req) {
    const headers = 'headers' in req ? req.headers : req.handshake.headers
    if (
      headers.host === 'localhost:8080' ||
      headers.host === 'nestchat-server.herokuapp.com' ||
      headers.host === '192.168.100.22:8080'
    ) {
      return this.usersService.getAllUsers();
    }
    throw new ForbiddenException();
  }
}
