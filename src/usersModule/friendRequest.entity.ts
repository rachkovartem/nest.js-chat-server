import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('friendRequests')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userSenderId: string;

  @Column()
  userRecipientId: string;

  @Column()
  userRecipientStatus: boolean;
}