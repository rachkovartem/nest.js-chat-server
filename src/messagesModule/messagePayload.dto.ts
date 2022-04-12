import { IsString } from 'class-validator';

export class messagePayloadDto {
  @IsString()
  roomId: string;

  @IsString()
  id: string;

  @IsString()
  message: string;

  @IsString()
  username: string;
}