import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm"
import {Push} from "./push.entity";
import {PushController} from "./push.controller";
import {PushService} from "./push.service";

@Module({
  imports: [TypeOrmModule.forFeature([Push])],
  providers: [PushService],
  controllers: [PushController],
})
export class PushModule {}