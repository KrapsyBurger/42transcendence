import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty()
  @MaxLength(25)
  name: string;

  @IsNotEmpty()
  ownerId: number;

  @IsNotEmpty()
  isPrivate: boolean;

  @IsOptional()
  password: string;

  @IsOptional()
  description?: string;
}
