import { IsString, IsArray } from 'class-validator';

export class createRoomDto {
  @IsArray()
  participants: string[];
}
