import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Push as PushEntity} from "./push.entity";

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushEntity)
    private pushRepository: Repository<PushEntity>,
  ) {
  }
}