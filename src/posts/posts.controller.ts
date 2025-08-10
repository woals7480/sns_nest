import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGurad } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

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
        await this.postsService.createPostImage(postDto);
        return this.postsService.createPost(userId, postDto);
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
