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

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('token/access')
    @UseGuards(RefreshTokenGurad)
    postTokenAccess(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, false);

        return { accessToken: newToken };
    }

    @Post('token/refresh')
    @UseGuards(RefreshTokenGurad)
    postTokenRefresh(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, true);

        return { refreshToken: newToken };
    }

    @Post('login/email')
    @UseGuards(BasicTokenGuard)
    postLoginEmail(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, false);
        const credentials = this.authService.decodeBasicToekn(token);

        return this.authService.loginWithEmail(credentials);
    }

    @Post('register/email')
    postRegisterEmail(
        @Body('email') email: string,
        @Body('password', new MaxLengthPipe(8), new MinLengthPipe(3))
        password: string,
        @Body('nickname') nickname: string,
    ) {
        return this.authService.registerWithEamil({
            email,
            password,
            nickname,
        });
    }
}
