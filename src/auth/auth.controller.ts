import { Body, Controller, Head, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('token/access')
    postTokenAccess(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, false);

        return { accessToken: newToken };
    }

    @Post('token/refresh')
    postTokenRefresh(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, true);

        const newToken = this.authService.rotateToken(token, true);

        return { refreshToken: newToken };
    }

    @Post('login/email')
    postLoginEmail(@Headers('authorization') rawToken: string) {
        const token = this.authService.extractTokenFromHeader(rawToken, false);
        const credentials = this.authService.decodeBasicToekn(token);

        return this.authService.loginWithEmail(credentials);
    }

    @Post('register/email')
    postRegisterEmail(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('nickname') nickname: string,
    ) {
        return this.authService.registerWithEamil({
            email,
            password,
            nickname,
        });
    }
}
