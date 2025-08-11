import {
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
    UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGurad } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ImageModelType } from 'src/common/entities/image.entity';
import { DataSource } from 'typeorm';
import { PostsImagesService } from './image/images.service';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly postsImagesService: PostsImagesService,
        private readonly dataSource: DataSource,
    ) {}

    // 전체 posts
    @Get()
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
    async postPost(@User('id') userId: number, @Body() postDto: CreatePostDto) {
        // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리 러너를 생성.
        const qr = this.dataSource.createQueryRunner();

        // 쿼리 러너에 연결.
        await qr.connect();

        //쿼리 러너에서 트랜잭션을 시작
        // 이 시점부터 같은 쿼리러너를 사용하면 트랜잭션 안에서 데이터베이스 액션을 실행 할 수 있다.
        await qr.startTransaction();

        //로직 실행
        try {
            const post = await this.postsService.createPost(
                userId,
                postDto,
                qr,
            );

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

            await qr.commitTransaction();
            await qr.release();

            return this.postsService.getPostById(post.id);
        } catch (e) {
            // 어떤 에러든 에러가 던져지면 트랜잭션을 종료하고 원래 상태로 되돌린다.
            await qr.rollbackTransaction();
            await qr.release();

            throw new InternalServerErrorException(e);
        }
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
