import {Controller, Get, Request, Post, UseGuards, Req} from '@nestjs/common';
import { AppService } from './app.service';
import {I18n, I18nContext, I18nLang, I18nService} from "nestjs-i18n";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('/getHello')
  getHello(): string {
    return this.appService.getHello();
  }
}
