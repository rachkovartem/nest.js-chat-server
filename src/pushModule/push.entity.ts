import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('push')
export class Push {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  endpoint: string;

  @Column({
    nullable: true,
  })
  expirationTime: string | null;

  @Column()
  p256dh: string;

  @Column()
  auth: string;
}
