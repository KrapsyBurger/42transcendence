import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { EditUserDto } from './dto';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') userIdString: string) {
    const userId = Number(userIdString);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.userService.findUserById(userId);
  }

  @Get()
  getUsers(@GetUser('id') userId: number) {
    return this.userService.findAllUsers(userId);
  }

  @Patch()
  async editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    try {
      const editedUser = await this.userService.editUser(userId, dto);
      return editedUser;
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma Unique Constraint Error
        const fieldName = error.meta.target[0];
        const capitalizedFieldName =
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        throw new ConflictException(
          `${capitalizedFieldName} already in use`,
          `${error.meta.target[0]}`,
        );
      } else if (error.code === 'P2025') {
        // Prisma Foreign Key Constraint Error
        throw new BadRequestException('Invalid foreign key constraint.');
      } else {
        throw new BadRequestException('Error while editing user');
      }
    }
  }

  @Delete()
  deleteUser(@GetUser('id') userId: number) {
    // secure the route by getting the user id from the token
    return this.userService.deleteUser(userId);
  }
}
