import { IsNotEmpty } from 'class-validator';

export class AddAdminDto {
  @IsNotEmpty()
  channelId: number;

  @IsNotEmpty()
  userId: number;
}
