import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from './decorator/roles.decorator';
import { RolesEnum } from './const/roles.const';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // @Post()
    // postUser(
    //     @Body('nickname') nickname: string,
    //     @Body('email') email: string,
    //     @Body('password') password: string,
    // ) {
    //     return this.usersService.createUser({ nickname, email, password });
    // }

    @Get()
    @Roles(RolesEnum.ADMIN)
    getUsers() {
        return this.usersService.getAllUsers();
    }
}
