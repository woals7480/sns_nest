import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entities/posts.entity';
import { UsersModel } from './users/entities/users.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
    ENV_DB_DATABASE_KEY,
    ENV_DB_HOST_KEY,
    ENV_DB_PASSWORD_KEY,
    ENV_DB_PORT_KEY,
    ENV_DB_USERNAME_KEY,
} from './common/const/env-keys.const';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/const/path.const';
import { ImageModel } from './common/entities/image.entity';
import { ChatsModule } from './chats/chats.module';
import { ChatsModel } from './chats/entities/chats.entity';
import { MessagesModel } from './chats/messages/entities/messages.entity';
import { CommentsModule } from './posts/comments/comments.module';
import { CommentsModel } from './posts/comments/entities/comments.entity';
import { RolesGuard } from './users/guard/roles.guard';
import { AccessTokenGurad } from './auth/guard/bearer-token.guard';
import { UserFollowersModel } from './users/entities/user-followers.entity';

@Module({
    imports: [
        PostsModule,
        ServeStaticModule.forRoot({
            rootPath: PUBLIC_FOLDER_PATH,
            serveRoot: '/public',
        }),
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env[ENV_DB_HOST_KEY],
            port: parseInt(process.env[ENV_DB_PORT_KEY] as string),
            username: process.env[ENV_DB_USERNAME_KEY],
            password: process.env[ENV_DB_PASSWORD_KEY],
            database: process.env[ENV_DB_DATABASE_KEY],
            entities: [
                PostsModel,
                UsersModel,
                ImageModel,
                ChatsModel,
                MessagesModel,
                CommentsModel,
                UserFollowersModel,
            ],
            synchronize: true,
        }),
        UsersModule,
        AuthModule,
        CommonModule,
        ChatsModule,
        CommentsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: AccessTokenGurad,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule {}
