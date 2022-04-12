import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  messageId: string;

  @Column()
  roomId: string;

  @Column()
  senderId: string;

  @Column()
  senderUsername: string;

  @Column()
  message: string;

  @Column()
  sendingDate: string;
}
