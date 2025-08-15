import {
    Body,
    Controller,
    Head,
    Headers,
    Post,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
    MaxLengthPipe,
    MinLengthPipe,
    PasswordPipe,
} from './pipe/password.pipe';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { RefreshTokenGurad } from './guard/bearer-token.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { isPublic } from 'src/common/decorator/is-public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('token/access')
    @isPublic()
    @UseGuards(RefreshTokenGurad)
    postTokenAccess(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, false);

        return { accessToken: newToken };
    }

    @Post('token/refresh')
    @isPublic()
    @UseGuards(RefreshTokenGurad)
    postTokenRefresh(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, true);

        return { refreshToken: newToken };
    }

    @Post('login/email')
    @isPublic()
    @UseGuards(BasicTokenGuard)
    postLoginEmail(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, false);
        const credentials = this.authService.decodeBasicToekn(token);

        return this.authService.loginWithEmail(credentials);
    }

    @Post('register/email')
    @isPublic()
    postRegisterEmail(@Body() body: RegisterUserDto) {
        return this.authService.registerWithEamil(body);
    }
}
