import { IsNotEmpty } from 'class-validator';

export class BanUserDto {
  @IsNotEmpty()
  channelId: number;

  @IsNotEmpty()
  userId: number;
}
