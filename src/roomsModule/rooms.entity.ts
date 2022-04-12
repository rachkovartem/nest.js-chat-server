import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  roomId: string;

  @Column()
  participants: string;

  @Column()
  groupRoom: boolean;

  @Column()
  creationDate: string;
}
