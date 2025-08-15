import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { ImageModel } from 'src/common/entities/image.entity';
import { PostsImagesService } from './image/images.service';
import { LogMiddleware } from 'src/common/middleware/log.middleware';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostsModel, ImageModel]),
        AuthModule,
        UsersModule,
        CommonModule,
    ],
    controllers: [PostsController],
    providers: [PostsService, PostsImagesService],
    exports: [PostsService],
})
export class PostsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogMiddleware).forRoutes({
            path: 'posts/*path',
            method: RequestMethod.GET,
        });
    }
}
