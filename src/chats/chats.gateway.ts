import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';
import {
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { SocketBearerTokenGuard } from 'src/auth/guard/socket/socket-bearer-token.guard';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
    // ws://localhost:3000/chats
    namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
    constructor(
        private readonly chatsService: ChatsService,
        private readonly messagesService: ChatsMessagesService,
        private readonly userService: UsersService,
        private readonly authService: AuthService,
    ) {}
    @WebSocketServer()
    server: Server;

    async handleConnection(socket: Socket & { user: UsersModel | null }) {
        console.log(`on connect called : ${socket.id}`);

        const headers = socket.handshake.headers;
        const rawToken = headers['authorization'];

        if (!rawToken) {
            socket.disconnect();
        }

        try {
            const token = this.authService.extractTokenFromHeader(
                rawToken as string,
                true,
            );
            const payload = this.authService.verifyToken(token);
            const user = await this.userService.getUserByEmail(payload.email);

            socket.user = user;
            return true;
        } catch (e) {
            socket.disconnect();
        }
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(SocketCatchHttpExceptionFilter)
    @SubscribeMessage('create_chat')
    async createChat(
        @MessageBody() data: CreateChatDto,
        @ConnectedSocket() socket: Socket & { user: UsersModel },
    ) {
        const chat = await this.chatsService.createChat(data);
    }

    @UsePipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(SocketCatchHttpExceptionFilter)
    @SubscribeMessage('enter_chat')
    async enterChat(
        // 방의 아이디들을 리스트로 받는다.
        @MessageBody() data: EnterChatDto,
        @ConnectedSocket() socket: Socket & { user: UsersModel },
    ) {
        for (const chatId of data.chatIds) {
            const exist = await this.chatsService.checkIfChatExists(chatId);

            if (!exist) {
                // exception 이벤트로 받을 수 있음
                throw new WsException({
                    message: `존재하지 않는 chat 입니다. chatId: ${chatId}`,
                });
            }
        }

        await socket.join(data.chatIds.map((v) => v.toString()));
    }

    // socket.on('send_message', (message) => {console.log(message)})
    @UsePipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    @UseFilters(SocketCatchHttpExceptionFilter)
    @SubscribeMessage('send_message')
    async sendMessage(
        @MessageBody() dto: CreateMessagesDto,
        @ConnectedSocket() socket: Socket & { user: UsersModel },
    ) {
        const chatExists = await this.chatsService.checkIfChatExists(
            dto.chatId,
        );

        if (!chatExists) {
            throw new WsException(
                `존재하지 않는 채팅방입니다. Chat ID: ${dto.chatId}`,
            );
        }

        const message = await this.messagesService.createMessage(
            dto,
            socket.user.id,
        );

        if (message) {
            socket
                .to(message.chat.id.toString())
                .emit('receive_message', message.message);
        }

        // this.server
        //     .in(message.chatId.toString())
        //     .emit('receive_message', message.message);
    }
}
