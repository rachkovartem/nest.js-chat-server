import {Body, Controller, Post, Req, UseGuards} from "@nestjs/common";
import {RoomsService} from "../roomsModule/rooms.service";
import {JwtAuthGuard} from "../authModule/guards/jwt-auth.guard";
import {PushService} from "./push.service";


@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {
  }

  @UseGuards(JwtAuthGuard)
  @Post('/push')
  async push(@Req() req) {
    console.log(req)
  }
}