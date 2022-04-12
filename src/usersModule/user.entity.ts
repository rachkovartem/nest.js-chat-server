import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable} from 'typeorm';
import { FriendRequest } from './friendRequest.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  registration: string;

  @Column('simple-array')
  friends: string[];

  @Column('simple-array')
  groupRooms: string[];

  @Column('simple-array')
  friendsRequests: string[];

  @Column()
  imagePath: string;
}
