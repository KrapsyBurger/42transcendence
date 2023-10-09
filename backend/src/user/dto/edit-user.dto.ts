import {
  IsOptional,
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class EditUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsOptional()
  isTwoFactorAuthenticationEnabled?: boolean;

  @IsOptional()
  isQrCodeScanned?: boolean;
}
