import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGurad } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ImageModelType } from 'src/common/entities/image.entity';
import { DataSource, QueryRunner as QR } from 'typeorm';
import { PostsImagesService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly postsImagesService: PostsImagesService,
        private readonly dataSource: DataSource,
    ) {}

    // 전체 posts
    @Get()
    @UseInterceptors(LogInterceptor)
    getPosts(@Query() query: PaginatePostDto) {
        return this.postsService.paginatePost(query);
    }

    // 해당 posts
    @Get(':id')
    getPost(@Param('id', ParseIntPipe) id: number) {
        return this.postsService.getPostById(id);
    }

    @Post('random')
    @UseGuards(AccessTokenGurad)
    async postPostsRandom(@User('id') userId: number) {
        await this.postsService.generatePosts(userId);
        return true;
    }

    // post 생성
    @Post()
    @UseGuards(AccessTokenGurad)
    @UseInterceptors(TransactionInterceptor)
    async postPost(
        @User('id') userId: number,
        @Body() postDto: CreatePostDto,
        @QueryRunner() qr: QR,
    ) {
        //로직 실행

        const post = await this.postsService.createPost(userId, postDto, qr);

        for (let i = 0; i < postDto.images.length; i++) {
            await this.postsImagesService.createPostImage(
                {
                    post,
                    order: i,
                    path: postDto.images[i],
                    type: ImageModelType.POST_IMAGE,
                },
                qr,
            );
        }

        return this.postsService.getPostById(post.id, qr);
    }

    // 해당 post 변경
    @Patch(':id')
    patchPost(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdatePostDto,
    ) {
        return this.postsService.updatePost(id, body);
    }

    // post 삭제
    @Delete(':id')
    deletePost(@Param('id', ParseIntPipe) id: number) {
        return this.postsService.deletePost(id);
    }
}
